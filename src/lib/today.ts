import { cache } from "react";
import { prisma } from "./prisma";
import { FORM_INFO } from "./medicine";
import { isDueOn, tehranDayRange, tehranParts, toFa } from "./time";

export type DoseItem = {
  key: string; // medicineId|HH:mm
  medicineId: string;
  name: string;
  dosage: string;
  subtitle: string; // «۲۰ میلی‌گرم • روزی یکبار»
  time: string; // HH:mm
  pills: number;
  unit: string; // قرص، کپسول، ...
  status: "PENDING" | "TAKEN" | "SKIPPED";
};

/** در هر درخواست فقط یک‌بار از دیتابیس خوانده می‌شود (کش per-request) */
export const getActiveMedicines = cache(async (userId: string) =>
  prisma.medicine.findMany({
    where: { userId, active: true },
    select: {
      id: true,
      memberId: true,
      name: true,
      dosage: true,
      form: true,
      pillsPerDose: true,
      intervalDays: true,
      times: true,
      stock: true,
      lowStockThreshold: true,
      startDate: true,
      endDate: true,
    },
  })
);

function frequencyLabel(timesPerDay: number, interval: number) {
  if (interval === 2) return "یک روز در میان";
  if (interval === 7) return "هفته‌ای یکبار";
  if (interval > 2) return "هر " + toFa(interval) + " روز";
  const words = ["", "روزی یکبار", "روزی دو بار", "روزی سه بار"];
  return words[timesPerDay] ?? "روزی " + toFa(timesPerDay) + " بار";
}

/** نوبت‌های امروزِ خود کاربر (داروهای اعضای خانواده جدا هستند) */
export async function getTodayDoses(userId: string): Promise<DoseItem[]> {
  const { dateKey } = tehranParts();

  const [meds, logs] = await Promise.all([
    getActiveMedicines(userId),
    prisma.doseLog.findMany({
      where: { userId, date: dateKey },
      select: { medicineId: true, time: true, status: true },
    }),
  ]);

  const done = new Map(logs.map((l) => [l.medicineId + "|" + l.time, l.status]));
  const items: DoseItem[] = [];

  for (const m of meds) {
    if (m.memberId !== null || !isDueOn(m, dateKey)) continue;
    for (const time of m.times) {
      const key = m.id + "|" + time;
      items.push({
        key,
        medicineId: m.id,
        name: m.name,
        dosage: m.dosage,
        subtitle: [m.dosage, frequencyLabel(m.times.length, m.intervalDays)]
          .filter(Boolean)
          .join(" • "),
        time,
        pills: m.pillsPerDose,
        unit: FORM_INFO[m.form].unit,
        status: done.get(key) ?? "PENDING",
      });
    }
  }
  return items.sort((a, b) => a.time.localeCompare(b.time));
}

export async function getLowStockCount(userId: string) {
  const meds = await getActiveMedicines(userId);
  return meds.filter((m) => m.stock !== null && m.stock <= m.lowStockThreshold).length;
}

export const getFamilyCount = (userId: string) =>
  prisma.familyMember.count({ where: { ownerId: userId } });

export async function getTodayAppointments(userId: string) {
  const { start, end } = tehranDayRange(tehranParts().dateKey);
  return prisma.appointment.findMany({
    where: { userId, at: { gte: start, lt: end } },
    orderBy: { at: "asc" },
    take: 3,
    select: { id: true, doctorName: true, specialty: true, clinic: true, at: true },
  });
}