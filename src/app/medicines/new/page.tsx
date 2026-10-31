import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/prisma";
import { isoToJalali } from "@/lib/jalali";
import { tehranParts } from "@/lib/time";
import MedicineForm from "./medicine-form";

export const metadata = {
  title: "افزودن دارو | دوزوا",
};

async function Content() {
  const user = await requireUser();
  if (!user.onboardedAt) redirect("/onboarding/role");
  await connection();

  const members = await prisma.familyMember.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
    take: 20,
  });
  const today = isoToJalali(tehranParts().dateKey);

  return <MedicineForm members={members} today={today} />;
}

export default function NewMedicinePage() {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-[#f4f8fe]" />}>
      <Content />
    </Suspense>
  );
}