import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import LogoutButton from "./logout-button";

export const metadata = {
  title: "خانه | دوزوا",
};

async function Content() {
  const user = await requireUser();
  if (!user.onboardedAt) redirect("/onboarding/role");

  return (
    <main
      dir="rtl"
      className="grid min-h-dvh place-items-center bg-gradient-to-b from-[#e8f2fe] via-[#f5f9ff] to-white p-6 text-center font-[Vazirmatn,IRANSans,Vazir,system-ui,sans-serif] text-[#0b2a5b]"
    >
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-extrabold">سلام، {user.fullName}</h1>
        <p className="mt-3 text-sm leading-8 text-[#5b6f8f]">
          ورود شما کامل شد. صفحه اصلی برنامه مصرف دارو در مرحله بعد ساخته می‌شود.
        </p>
        <LogoutButton />
      </div>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={<main className="min-h-dvh bg-gradient-to-b from-[#e8f2fe] via-[#f5f9ff] to-white" />}
    >
      <Content />
    </Suspense>
  );
}