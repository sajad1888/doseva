import { prisma } from "./prisma";
import { getActiveMedicines } from "./today";
import { FORM_INFO } from "./medicine";
import { addDaysIso, tehranParts } from "./time";

export const PAST_DAYS = 14;
export const FUTURE_DAYS = 30;

export type ScheduleMed = {
  id: string;
  memberId: string | null;
  name: string;
  dosage: string;
  unit: string;
  pills: number;
  intervalDays: number;
  times: string[];
  startDate: string;
  endDate: string | null;
};

export type ScheduleLog = {
  medicineId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  takenAt: string; // ISO
};

export type ScheduleData = {
  today: string;
  nowTime: string;
  rangeFrom: string;
  rangeTo: string;
  members: { id: string; name: string }[];
  meds: ScheduleMed[];
  logs: ScheduleLog[];
};

/**
 * همه‌ی داده‌ی لازم برای چند هفته در یک رفت‌وبرگشت؛
 * جابه‌جایی بین روزها و افراد بعدش کاملاً سمت کلاینت و فوری است.
 */
export async function getScheduleData(userId: string): Promise<ScheduleData> {
  const { dateKey: today, time: nowTime } = tehranParts();
  const rangeFrom = addDaysIso(today, -PAST_DAYS);
  const rangeTo = addDaysIso(today, FUTURE_DAYS);

  const [members, allMeds, logs] = await Promise.all([
    prisma.familyMember.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true },
      take: 20,
    }),
    getActiveMedicines(userId),
    prisma.doseLog.findMany({
      where: { userId, status: "TAKEN", date: { gte: rangeFrom, lte: today } },
      select: { medicineId: true, date: true, time: true, takenAt: true },
    }),
  ]);

  const meds: ScheduleMed[] = allMeds
    .filter((m) => m.startDate <= rangeTo && (!m.endDate || m.endDate >= rangeFrom))
    .map((m) => ({
      id: m.id,
      memberId: m.memberId,
      name: m.name,
      dosage: m.dosage,
      unit: FORM_INFO[m.form].unit,
      pills: m.pillsPerDose,
      intervalDays: m.intervalDays,
      times: m.times,
      startDate: m.startDate,
      endDate: m.endDate,
    }));

  return {
    today,
    nowTime,
    rangeFrom,
    rangeTo,
    members,
    meds,
    logs: logs.map((l) => ({
      medicineId: l.medicineId,
      date: l.date,
      time: l.time,
      takenAt: l.takenAt.toISOString(),
    })),
  };
}