import { NextResponse } from "next/server";

export function fail(
  status: number,
  code: string,
  message: string,
  extra?: Record<string, unknown>
) {
  return NextResponse.json({ ok: false, error: { code, message, ...extra } }, { status });
}