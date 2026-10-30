export type IdentifierType = "phone" | "email";

export const toLatinDigits = (v: string) =>
  v
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));

/** مقدار نرمال‌شده را برمی‌گرداند، یا اگر معتبر نبود null */
export function normalizeIdentifier(type: IdentifierType, raw: string): string | null {
  if (type === "phone") {
    let v = toLatinDigits(raw).replace(/[\s-]/g, "");
    if (v.startsWith("+98")) v = "0" + v.slice(3);
    else if (v.startsWith("98") && v.length === 12) v = "0" + v.slice(2);
    return /^09\d{9}$/.test(v) ? v : null;
  }
  const v = raw.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 254 ? v : null;
}