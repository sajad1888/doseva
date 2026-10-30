import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { fail } from "@/lib/http";
import { normalizeIdentifier, toLatinDigits } from "@/lib/auth/identifier";
import { OTP_MAX_ATTEMPTS, hashCode, safeEqual } from "@/lib/auth/otp";
import { createSession } from "@/lib/auth/session";

const bodySchema = z.object({
  type: z.enum(["phone", "email"]),
  value: z.string().min(1).max(254),
  code: z.string().min(1).max(12),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "INVALID_BODY", "درخواست نامعتبر است.");

  const { type, value } = parsed.data;
  const code = toLatinDigits(parsed.data.code).replace(/\s/g, "");
  const identifier = normalizeIdentifier(type, value);
  if (!identifier || !/^\d{6}$/.test(code)) {
    return fail(422, "INVALID_INPUT", "کد تأیید ۶ رقمی را وارد کنید.");
  }

  const record = await prisma.otpCode.findFirst({
    where: { identifier, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!record) return fail(400, "CODE_EXPIRED", "کد منقضی شده است. کد جدید بگیرید.");
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    return fail(429, "TOO_MANY_ATTEMPTS", "تعداد تلاش‌ها زیاد بود. کد جدید بگیرید.");
  }

  if (!safeEqual(hashCode(identifier, code), record.codeHash)) {
    await prisma.otpCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return fail(400, "INVALID_CODE", "کد واردشده درست نیست.");
  }

  // مصرف کد به‌صورت اتمیک؛ جلوی استفاده‌ی دوباره را می‌گیرد
  const consumed = await prisma.otpCode.updateMany({
    where: { id: record.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  if (consumed.count === 0) return fail(400, "CODE_USED", "این کد قبلاً استفاده شده است.");

  const where = type === "phone" ? { phone: identifier } : { email: identifier };
  const existing = await prisma.user.findUnique({ where });
  const user = existing ?? (await prisma.user.create({ data: where }));

  await createSession(user.id);

  return NextResponse.json({
    ok: true,
    isNewUser: !existing,
    needsOnboarding: !user.onboardedAt,
    user: { id: user.id, phone: user.phone, email: user.email },
  });
}