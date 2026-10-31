import { NextResponse } from "next/server";

export function fail(
  status: number,
  code: string,
  message: string,
  extra?: Record<string, unknown>
) {
  return NextResponse.json({ ok: false, error: { code, message, ...extra } }, { status });
}

/** جلوگیری از درخواست‌های cross-site روی APIهای تغییردهنده */
export function isSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true; // درخواست غیرمرورگری؛ بدون کوکی نشست هم کاری نمی‌کند
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}