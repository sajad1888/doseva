import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { fail, isSameOrigin } from "@/lib/http";
import { getSessionUserId } from "@/lib/auth/session";
import { jalaliToIso } from "@/lib/jalali";
import { FORM_VALUES, UNIT_LABEL, UNIT_VALUES, MAX_TIMES } from "@/lib/medicine";
import { addDaysIso, tehranParts, toFa, toLatinDigits } from "@/lib/time";

const MAX_MEDICINES = 100;
const MAX_MEMBERS = 20;

const bodySchema = z.object({
  forWhom: z.enum(["self", "family"]),
  memberId: z.string().min(1).max(40).optional(),
  newMemberName: z.string().trim().min(2).max(40).optional(),
  name: z.string().trim().min(2).max(80),
  strengthValue: z.string().trim().max(10).optional(),
  strengthUnit: z.enum(UNIT_VALUES).optional(),
  form: z.enum(FORM_VALUES),
  intervalDays: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(7)]),
  pillsPerDose: z.number().int().min(1).max(20),
  times: z.array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)).min(1).max(MAX_TIMES),
  start: z.object({ y: z.number().int(), m: z.number().int(), d: z.number().int() }),
  durationDays: z.number().int().min(1).max(730).nullable().optional(),
  stock: z.number().int().min(0).max(100000).nullable().optional(),
});

/** افزودن دارو برای خود کاربر یا یکی از اعضای خانواده */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return fail(403, "FORBIDDEN", "درخواست نامعتبر است.");

  const userId = await getSessionUserId();
  if (!userId) return fail(401, "UNAUTHENTICATED", "وارد حساب خود شوید.");

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "INVALID_BODY", "اطلاعات واردشده معتبر نیست.");
  const b = parsed.data;

  // نام: فاصله‌ها یکی و حروف عربی به فارسی
  const name = b.name.replace(/\s+/g, " ").replace(/ي/g, "ی").replace(/ك/g, "ک");

  // قدرت دارو
  let dosage = "";
  if (b.strengthValue) {
    const v = toLatinDigits(b.strengthValue);
    if (!/^\d{1,5}(\.\d{1,2})?$/.test(v) || !b.strengthUnit) {
      return fail(422, "INVALID_STRENGTH", "قدرت دارو را درست وارد کنید.");
    }
    dosage = toFa(v) + " " + UNIT_LABEL[b.strengthUnit];
  }

  // ساعت‌ها: یکتا و مرتب
  const times = [...new Set(b.times)].sort();

  // تاریخ شروع (شمسی -> میلادی) در بازه‌ی منطقی
  const startDate = jalaliToIso(b.start.y, b.start.m, b.start.d);
  if (!startDate) return fail(422, "INVALID_START", "تاریخ شروع معتبر نیست.");
  const today = tehranParts().dateKey;
  if (startDate < addDaysIso(today, -365) || startDate > addDaysIso(today, 365)) {
    return fail(422, "INVALID_START", "تاریخ شروع باید نزدیک به امروز باشد.");
  }
  const endDate = b.durationDays ? addDaysIso(startDate, b.durationDays - 1) : null;

  // برای چه کسی؟
  let memberConnect: { connect: { id: string } } | { create: { name: string; owner: { connect: { id: string } } } } | undefined;
  let memberId: string | null = null;

  if (b.forWhom === "family") {
    if (b.memberId) {
      const member = await prisma.familyMember.findFirst({
        where: { id: b.memberId, ownerId: userId },
        select: { id: true },
      });
      if (!member) return fail(404, "MEMBER_NOT_FOUND", "عضو خانواده پیدا نشد.");
      memberId = member.id;
      memberConnect = { connect: { id: member.id } };
    } else if (b.newMemberName) {
      const count = await prisma.familyMember.count({ where: { ownerId: userId } });
      if (count >= MAX_MEMBERS) {
        return fail(422, "LIMIT", "تعداد اعضای خانواده به حداکثر رسیده است.");
      }
      memberConnect = {
        create: {
          name: b.newMemberName.replace(/\s+/g, " "),
          owner: { connect: { id: userId } },
        },
      };
    } else {
      return fail(422, "MEMBER_REQUIRED", "عضو خانواده را انتخاب کنید.");
    }
  }

  // سقف تعداد و جلوگیری از دارو تکراری
  const [total, duplicate] = await Promise.all([
    prisma.medicine.count({ where: { userId, active: true } }),
    memberId !== null || b.forWhom === "self"
      ? prisma.medicine.findFirst({
          where: {
            userId,
            memberId,
            active: true,
            name: { equals: name, mode: "insensitive" },
          },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);
  if (total >= MAX_MEDICINES) return fail(422, "LIMIT", "تعداد داروها به حداکثر رسیده است.");
  if (duplicate) return fail(409, "DUPLICATE", "این دارو قبلاً اضافه شده است.");

  // آستانه‌ی «رو به اتمام»: حدود سه روز مصرف
  const lowStockThreshold = Math.max(3, b.pillsPerDose * times.length * 3);

  const medicine = await prisma.medicine.create({
    data: {
      user: { connect: { id: userId } },
      ...(memberConnect ? { member: memberConnect } : {}),
      name,
      dosage,
      form: b.form,
      pillsPerDose: b.pillsPerDose,
      intervalDays: b.intervalDays,
      times,
      stock: b.stock ?? null,
      lowStockThreshold,
      startDate,
      endDate,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, medicine }, { status: 201 });
}