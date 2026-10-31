import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fail, isSameOrigin } from "@/lib/http";
import { getSessionUserId } from "@/lib/auth/session";
import { tehranParts } from "@/lib/time";

const bodySchema = z.object({
  medicineId: z.string().min(1).max(40),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});

/** ثبت مصرف یک نوبت دارو برای امروز */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return fail(403, "FORBIDDEN", "درخواست نامعتبر است.");

  const userId = await getSessionUserId();
  if (!userId) return fail(401, "UNAUTHENTICATED", "وارد حساب خود شوید.");

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "INVALID_BODY", "درخواست نامعتبر است.");
  const { medicineId, time } = parsed.data;

  // فقط داروی خود کاربر؛ تاریخ را سرور تعیین می‌کند نه کلاینت
  const med = await prisma.medicine.findFirst({
    where: { id: medicineId, userId, active: true },
    select: { id: true, times: true, pillsPerDose: true },
  });
  if (!med || !med.times.includes(time)) {
    return fail(404, "NOT_FOUND", "این نوبت مصرف پیدا نشد.");
  }

  const { dateKey } = tehranParts();

  try {
    await prisma.$transaction([
      prisma.doseLog.create({
        data: { medicineId, userId, date: dateKey, time, status: "TAKEN" },
      }),
      // موجودی هرگز منفی نمی‌شود
      prisma.medicine.updateMany({
        where: { id: medicineId, stock: { lt: med.pillsPerDose } },
        data: { stock: 0 },
      }),
      prisma.medicine.updateMany({
        where: { id: medicineId, stock: { gte: med.pillsPerDose } },
        data: { stock: { decrement: med.pillsPerDose } },
      }),
    ]);
  } catch (e) {
    // قبلاً ثبت شده (کلیک دوباره یا دو تب): خطا نیست
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ ok: true, alreadyTaken: true });
    }
    console.error("dose log failed", e);
    return fail(500, "SERVER_ERROR", "ثبت مصرف انجام نشد. دوباره تلاش کنید.");
  }

  return NextResponse.json({ ok: true });
}