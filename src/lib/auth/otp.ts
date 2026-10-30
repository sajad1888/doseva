import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

export const OTP_TTL_SECONDS = 120;
export const OTP_RESEND_SECONDS = 60;
export const OTP_MAX_PER_HOUR = 5;
export const OTP_MAX_ATTEMPTS = 5;

export const generateCode = () => String(randomInt(0, 1_000_000)).padStart(6, "0");

export function hashCode(identifier: string, code: string) {
  return createHmac("sha256", process.env.OTP_SECRET!)
    .update(identifier + ":" + code)
    .digest("hex");
}

export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}