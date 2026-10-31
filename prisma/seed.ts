// اجرا:  npx tsx --env-file=.env prisma/seed.ts 09123456789
// فقط برای تست؛ داروها، نوبت‌ها و اعضای خانواده‌ی همان کاربر را پاک و دوباره می‌سازد.
import { PrismaClient } from "@prisma/client";
import { tehranParts } from "../src/lib/time";

const prisma = new PrismaClient();

async function main() {
  const phone = process.argv[2];
  if (!phone) throw new Error("شماره کاربر را بدهید: npx tsx --env-file=.env prisma/seed.ts 09123456789");

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) throw new Error("کاربری با این شماره پیدا نشد. اول یک بار در سایت وارد شوید.");

  const { dateKey } = tehranParts();

  await prisma.medicine.deleteMany({ where: { userId: user.id } });
  await prisma.appointment.deleteMany({ where: { userId: user.id } });
  await prisma.familyMember.deleteMany({ where: { ownerId: user.id } });

  const metformin = await prisma.medicine.create({
    data: {
      userId: user.id,
      name: "متفورمین ۵۰۰",
      dosage: "۵۰۰ میلی‌گرم",
      times: ["08:00", "20:00"],
      stock: 40,
      startDate: dateKey,
    },
  });
  await prisma.medicine.create({
    data: {
      userId: user.id,
      name: "ویتامین دی۳",
      dosage: "۱۰۰۰ واحد",
      times: ["10:00"],
      stock: 3, // رو به اتمام
      lowStockThreshold: 5,
      startDate: dateKey,
    },
  });
  await prisma.doseLog.create({
    data: { medicineId: metformin.id, userId: user.id, date: dateKey, time: "08:00", status: "TAKEN" },
  });

  await prisma.appointment.create({
    data: {
      userId: user.id,
      doctorName: "دکتر سارا احمدی",
      specialty: "متخصص داخلی",
      clinic: "کلینیک بهار",
      at: new Date(dateKey + "T16:30:00+03:30"),
    },
  });
  await prisma.familyMember.createMany({
    data: [
      { ownerId: user.id, name: "مادر", relation: "مادر" },
      { ownerId: user.id, name: "پدر", relation: "پدر" },
    ],
  });

  console.log("داده‌ی نمونه برای " + phone + " ساخته شد.");
}

main()
  .catch((e) => {
    console.error(e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());