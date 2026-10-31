import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import {
  getFamilyCount,
  getLowStockCount,
  getTodayAppointments,
  getTodayDoses,
} from "@/lib/today";
import { formatJalaliHeader, formatTimeOfDate, toFa } from "@/lib/time";
import BottomNav from "@/components/bottom-nav";
import TodayPanel from "./today-panel";

export const metadata = {
  title: "خانه | دوزوا",
};

const CARD = "rounded-3xl bg-white p-4 shadow-[0_1px_0_#e6eef9]";

function Skeleton({ className }: { className: string }) {
  return <div className={"animate-pulse rounded-3xl bg-[#e3edf9] " + className} />;
}

function PageSkeleton() {
  return (
    <>
      <Skeleton className="mt-2 h-12 w-2/3" />
      <Skeleton className="mt-5 h-36" />
      <Skeleton className="mt-6 h-48" />
    </>
  );
}

async function Gate() {
  const user = await requireUser();
  if (!user.onboardedAt) redirect("/onboarding/role");
  await connection();

  const firstName = (user.fullName ?? "").trim().split(/\s+/)[0] || "دوست";

  return (
    <>
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold">سلام {firstName} جان</h1>
          <p className="mt-1 text-xs text-[#5b6f8f]">{formatJalaliHeader()}</p>
        </div>
        <Link
          href="/notifications"
          aria-label="اعلان‌ها"
          className="grid h-11 w-11 place-items-center rounded-2xl bg-white shadow-[0_1px_0_#e6eef9]"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" />
            <path d="M10 21h4" />
          </svg>
        </Link>
      </header>

      {/* هر بخش مستقل و هم‌زمان از دیتابیس می‌خواند و جدا استریم می‌شود */}
      <Suspense fallback={<Skeleton className="mt-5 h-72" />}>
        <Today userId={user.id} />
      </Suspense>
      <Suspense fallback={<Skeleton className="mt-4 h-24" />}>
        <Stats userId={user.id} />
      </Suspense>
      <Suspense fallback={<Skeleton className="mt-6 h-24" />}>
        <Appointments userId={user.id} />
      </Suspense>
    </>
  );
}

async function Today({ userId }: { userId: string }) {
  await connection();
  const doses = await getTodayDoses(userId);
  return <TodayPanel initialDoses={doses} />;
}

async function Stats({ userId }: { userId: string }) {
  await connection();
  const [low, family] = await Promise.all([getLowStockCount(userId), getFamilyCount(userId)]);

  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      <Link href="/medicines" className={CARD}>
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#1583db]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
          <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
        </svg>
        <p className="mt-3 text-[15px] font-bold">موجودی دارو</p>
        <p className={"mt-1 text-xs " + (low ? "text-amber-600" : "text-[#5b6f8f]")}>
          {low ? toFa(low) + " دارو رو به اتمام" : "موجودی همه داروها خوب است"}
        </p>
      </Link>
      <Link href="/family" className={CARD}>
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#1583db]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20c0-3.6 2.9-5.5 6.5-5.5s6.5 1.9 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c2 .6 3.5 2.2 3.5 5.2" />
        </svg>
        <p className="mt-3 text-[15px] font-bold">اعضای خانواده</p>
        <p className="mt-1 text-xs text-[#5b6f8f]">
          {family ? toFa(family) + " نفر تحت مراقبت" : "هنوز کسی اضافه نشده"}
        </p>
      </Link>
    </div>
  );
}

async function Appointments({ userId }: { userId: string }) {
  await connection();
  const list = await getTodayAppointments(userId);

  return (
    <section>
      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-base font-bold">نوبت پزشک امروز</h2>
        <Link href="/appointments" className="text-sm text-[#1583db]">
          همه نوبت‌ها
        </Link>
      </div>

      {list.length === 0 ? (
        <p className={CARD + " mt-3 text-center text-sm text-[#5b6f8f]"}>
          امروز نوبت پزشکی نداری.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {list.map((a) => (
            <li key={a.id} className={CARD + " flex items-center gap-3"}>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#e8f2fe] text-[#1583db]">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 3v6a4 4 0 0 0 8 0V3M10 13v2a5 5 0 0 0 10 0v-2" />
                  <circle cx="20" cy="11" r="2" />
                </svg>
              </span>
              <div className="flex-1">
                <p className="text-[15px] font-bold">{a.doctorName}</p>
                <p className="mt-1 text-xs text-[#5b6f8f]">
                  {[a.specialty, a.clinic].filter(Boolean).join(" • ")}
                </p>
              </div>
              <span className="rounded-full bg-[#e8f2fe] px-3 py-1 text-xs font-bold text-[#1583db]">
                {formatTimeOfDate(a.at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function HomePage() {
  return (
    <main
      dir="rtl"
      className="min-h-dvh bg-[#f4f8fe] font-[Vazirmatn,IRANSans,Vazir,system-ui,sans-serif] text-[#0b2a5b]"
    >
      <div className="mx-auto w-full max-w-md px-5 pb-28 pt-6">
        <Suspense fallback={<PageSkeleton />}>
          <Gate />
        </Suspense>
      </div>
      <BottomNav />
    </main>
  );
}