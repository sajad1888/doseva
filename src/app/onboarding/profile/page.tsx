import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import ProfileForm from "./profile-form";

export const metadata = {
  title: "اطلاعات تکمیلی | دوزوا",
};

async function Content() {
  const user = await requireUser();
  if (user.onboardedAt) redirect("/home");
  if (!user.role) redirect("/onboarding/role");
  return (
    <ProfileForm
      initial={{
        fullName: user.fullName ?? "",
        birthDate: user.birthDate ?? "",
        companionPhone: user.companionPhone ?? "",
      }}
    />
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={<main className="min-h-dvh bg-gradient-to-b from-[#e8f2fe] via-[#f5f9ff] to-white" />}
    >
      <Content />
    </Suspense>
  );
}