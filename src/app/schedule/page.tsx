import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { getScheduleData } from "@/lib/schedule";
import BottomNav from "@/components/bottom-nav";
import ScheduleView from "./schedule-view";

export const metadata = {
  title: "برنامه مصرف | دوزوا",
};

function Skeleton({ className }: { className: string }) {
  return <div className={"animate-pulse rounded-3xl bg-[#e3edf9] " + className} />;
}

async function Content() {
  const user = await requireUser();
  if (!user.onboardedAt) redirect("/onboarding/role");
  await connection();

  const data = await getScheduleData(user.id);
  return <ScheduleView data={data} />;
}

export default function SchedulePage() {
  return (
    <main
      dir="rtl"
      className="min-h-dvh bg-[#f4f8fe] font-[Vazirmatn,IRANSans,Vazir,system-ui,sans-serif] text-[#0b2a5b]"
    >
      <div className="mx-auto w-full max-w-md px-5 pb-28 pt-6">
        <Suspense
          fallback={
            <>
              <Skeleton className="h-14 w-2/3" />
              <Skeleton className="mt-5 h-14" />
              <Skeleton className="mt-4 h-24" />
              <Skeleton className="mt-6 h-40" />
            </>
          }
        >
          <Content />
        </Suspense>
      </div>
      <BottomNav />
    </main>
  );
}