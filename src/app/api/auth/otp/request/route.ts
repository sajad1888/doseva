import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { fail } from "@/lib/http";
import { normalizeIdentifier } from "@/lib/auth/identifier";
import {
  OTP_MAX_PER_HOUR,
  OTP_RESEND_SECONDS,
  OTP_TTL_SECONDS,
  generateCode,
  hashCode,
} from "@/lib/auth/otp";
import { sendOtp } from "@/lib/auth/sender";

const bodySchema = z.object({
  type: z.enum(["phone", "email"]),
  value: z.string().min(1).max(254),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "INVALID_BODY", "درخواست نامعتبر است.");

  const { type, value } = parsed.data;
  const identifier = normalizeIdentifier(type, value);
  if (!identifier) {
    return fail(
      422,
      "INVALID_IDENTIFIER",
      type === "phone" ? "شماره تماس معتبر نیست." : "ایمیل معتبر نیست."
    );
  }

  // محدودیت ارسال مجدد
  const last = await prisma.otpCode.findFirst({
    where: { identifier },
    orderBy: { createdAt: "desc" },
  });
  if (last) {
    const wait = OTP_RESEND_SECONDS - Math.floor((Date.now() - last.createdAt.getTime()) / 1000);
    if (wait > 0) {
      return fail(429, "RESEND_TOO_SOON", wait + " ثانیه دیگر دوباره تلاش کنید.", {
        retryAfter: wait,
      });
    }
  }

  // سقف ارسال در ساعت
  const lastHour = await prisma.otpCode.count({
    where: { identifier, createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) } },
  });
  if (lastHour >= OTP_MAX_PER_HOUR) {
    return fail(429, "RATE_LIMITED", "تعداد درخواست‌ها زیاد بود. بعداً دوباره تلاش کنید.");
  }

  const code = generateCode();
  const record = await prisma.otpCode.create({
    data: {
      identifier,
      codeHash: hashCode(identifier, code),
      expiresAt: new Date(Date.now() + OTP_TTL_SECONDS * 1000),
    },
  });

  try {
    await sendOtp(type, identifier, code);
  } catch (err) {
    console.error("sendOtp failed", err);
    await prisma.otpCode.delete({ where: { id: record.id } });
    return fail(502, "SEND_FAILED", "ارسال کد انجام نشد. دوباره تلاش کنید.");
  }

  return NextResponse.json({
    ok: true,
    expiresIn: OTP_TTL_SECONDS,
    resendAfter: OTP_RESEND_SECONDS,
  });
}