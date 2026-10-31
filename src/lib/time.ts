// همه‌ی زمان‌ها به وقت تهران (UTC+3:30، بدون ساعت تابستانی)
const TZ = "Asia/Tehran";

export const toFa = (s: string | number) =>
  String(s).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

export const toLatinDigits = (s: string) =>
  s
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));

export function tehranParts(d: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return {
    dateKey: get("year") + "-" + get("month") + "-" + get("day"), // 2026-10-31
    time: get("hour") + ":" + get("minute"), // 14:05
  };
}

/** شروع و پایان روز تهران به‌صورت لحظه‌ی UTC */
export function tehranDayRange(dateKey: string) {
  const start = new Date(dateKey + "T00:00:00+03:30");
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

export const formatClock = (hhmm: string) => toFa(hhmm);

export const formatTimeOfDate = (d: Date) => toFa(tehranParts(d).time);

/** مثل: شنبه، ۹ آبان ۱۴۰۵ */
export function formatJalaliHeader(d: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return get("weekday") + "، " + get("day") + " " + get("month") + " " + get("year");
}

const DAY_MS = 24 * 60 * 60 * 1000;

export const addDaysIso = (iso: string, n: number) =>
  new Date(Date.parse(iso + "T00:00:00Z") + n * DAY_MS).toISOString().slice(0, 10);

export const daysBetween = (fromIso: string, toIso: string) =>
  Math.round((Date.parse(toIso + "T00:00:00Z") - Date.parse(fromIso + "T00:00:00Z")) / DAY_MS);

/** آیا این دارو در تاریخ داده‌شده نوبت مصرف دارد؟ */
export function isDueOn(
  m: { startDate: string; endDate: string | null; intervalDays: number },
  dateKey: string
) {
  if (m.startDate > dateKey) return false;
  if (m.endDate && m.endDate < dateKey) return false;
  return daysBetween(m.startDate, dateKey) % m.intervalDays === 0;
}