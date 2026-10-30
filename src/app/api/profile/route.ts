import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fail } from "@/lib/http";
import { getSessionUserId } from "@/lib/auth/session";
import { normalizeIdentifier, toLatinDigits } from "@/lib/auth/identifier";

const SELECT = {
  id: true,
  phone: true,
  email: true,
  role: true,
  fullName: true,
  birthDate: true,
  companionPhone: true,
  onboardedAt: true,
} as const;

const bodySchema = z.object({
  role: z.enum(["PATIENT", "PATIENT_WITH_CAREGIVER", "CAREGIVER"]).optional(),
  fullName: z.string().trim().min(3).max(80).optional(),
  birthDate: z.string().max(20).optional(),
  companionPhone: z.string().max(20).optional(),
});

/** تاریخ شمسی را به شکل 1370/01/01 درمی‌آورد؛ اگر معتبر نبود null */
function normalizeBirthDate(raw: string): string | null {
  const v = toLatinDigits(raw).trim().replace(/[-.]/g, "/");
  const m = v.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (y < 1300 || y > 1405 || mo < 1 || mo > 12) return null;
  if (d < 1 || d > (mo <= 6 ? 31 : 30)) return null;
  return m[1] + "/" + String(mo).padStart(2, "0") + "/" + String(d).padStart(2, "0");
}

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return fail(401, "UNAUTHENTICATED", "وارد حساب خود شوید.");

  const user = await prisma.user.findUnique({ where: { id: userId }, select: SELECT });
  if (!user) return fail(401, "UNAUTHENTICATED", "وارد حساب خود شوید.");

  return NextResponse.json({ ok: true, user });
}

export async function PATCH(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return fail(401, "UNAUTHENTICATED", "وارد حساب خود شوید.");

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "INVALID_BODY", "اطلاعات واردشده معتبر نیست.");

  const { role, fullName, birthDate, companionPhone } = parsed.data;
  const data: Prisma.UserUpdateInput = {};

  if (role) data.role = role;
  if (fullName !== undefined) data.fullName = fullName;

  if (birthDate !== undefined) {
    const b = normalizeBirthDate(birthDate);
    if (!b) return fail(422, "INVALID_BIRTHDATE", "تاریخ تولد را مثل ۱۳۷۰/۰۱/۰۱ وارد کنید.");
    data.birthDate = b;
  }

  if (companionPhone !== undefined) {
    if (companionPhone.trim() === "") {
      data.companionPhone = null;
    } else {
      const p = normalizeIdentifier("phone", companionPhone);
      if (!p) return fail(422, "INVALID_PHONE", "شماره همراه معتبر نیست.");
      data.companionPhone = p;
    }
  }

  let user = await prisma.user.update({ where: { id: userId }, data, select: SELECT });

  // وقتی نقش و نام هر دو ثبت شد، ثبت‌نام کامل حساب می‌شود
  if (!user.onboardedAt && user.role && user.fullName) {
    user = await prisma.user.update({
      where: { id: userId },
      data: { onboardedAt: new Date() },
      select: SELECT,
    });
  }

  return NextResponse.json({ ok: true, user });
}