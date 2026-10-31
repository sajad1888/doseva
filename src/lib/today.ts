import { cache } from "react";
import { prisma } from "./prisma";
import { tehranDayRange, tehranParts, toFa } from "./time";

export type DoseItem = {
  key: string; // medicineId|HH:mm
  medicineId: string;
  name: string;
  dosage: string;
  subtitle: string; // «۱۰۰۰ واحد • روزی یکبار»
  time: string; // HH:mm
  pills: number;
  status: "PENDING" | "TAKEN" | "SKIPPED";
};

/** در هر درخواست فقط یک‌بار از دیتابیس خوانده می‌شود (کش per-request) */
export const getActiveMedicines = cache(async (userId: string) =>
  prisma.medicine.findMany({
    where: { userId, active: true },
    select: {
      id: true,
      name: true,
      dosage: true,
      pillsPerDose: true,
      times: true,
      stock: true,
      lowStockThreshold: true,
      startDate: true,
      endDate: true,
    },
  })
);

function frequencyLabel(n: number) {
  const words = ["", "روزی یکبار", "روزی دو بار", "روزی سه بار"];
  return words[n] ?? "روزی " + toFa(n) + " بار";
}

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
    if (m.startDate > dateKey || (m.endDate && m.endDate < dateKey)) continue;
    for (const time of m.times) {
      const key = m.id + "|" + time;
      items.push({
        key,
        medicineId: m.id,
        name: m.name,
        dosage: m.dosage,
        subtitle: m.dosage + " • " + frequencyLabel(m.times.length),
        time,
        pills: m.pillsPerDose,
        status: done.get(key) ?? "PENDING",
      });
    }
  }
  return items.sort((a, b) => a.time.localeCompare(b.time));
}

export async function getLowStockCount(userId: string) {
  const meds = await getActiveMedicines(userId);
  return meds.filter((m) => m.stock <= m.lowStockThreshold).length;
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