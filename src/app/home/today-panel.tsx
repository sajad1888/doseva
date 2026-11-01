"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DoseItem } from "@/lib/today";
import { toFa } from "@/lib/time";

export default function TodayPanel({ initialDoses }: { initialDoses: DoseItem[] }) {
  const router = useRouter();
  const [doses, setDoses] = useState(initialDoses);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState("");

  // بعد از router.refresh داده‌ی تازه‌ی سرور جایگزین می‌شود
  // (به‌جای useEffect: همگام‌سازی state هنگام رندر، روش پیشنهادی React)
  const [prevInitial, setPrevInitial] = useState(initialDoses);
  if (initialDoses !== prevInitial) {
    setPrevInitial(initialDoses);
    setDoses(initialDoses);
  }

  const total = doses.length;
  const taken = doses.filter((d) => d.status === "TAKEN").length;
  const next = doses.find((d) => d.status === "PENDING");
  const percent = total ? Math.round((taken / total) * 100) : 0;

  function setStatus(key: string, status: DoseItem["status"]) {
    setDoses((prev) => prev.map((d) => (d.key === key ? { ...d, status } : d)));
  }

  async function confirm(d: DoseItem) {
    if (busyKey) return;
    setBusyKey(d.key);
    setError("");
    setStatus(d.key, "TAKEN"); // خوش‌بینانه: فوری نشان بده

    let message = "اتصال برقرار نشد. دوباره تلاش کنید.";
    try {
      const res = await fetch("/api/doses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicineId: d.medicineId, time: d.time }),
      });
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        message = data?.error?.message ?? "ثبت مصرف انجام نشد.";
        throw new Error(message);
      }
      router.refresh(); // موجودی و بقیه‌ی کارت‌ها به‌روز شوند
    } catch {
      setStatus(d.key, "PENDING");
      setError(message);
    } finally {
      setBusyKey(null);
    }
  }

  const heroLine = next
    ? "نوبت بعدی ساعت " + toFa(next.time) + " است."
    : total
      ? "همه‌ی نوبت‌های امروز ثبت شد."
      : "برای امروز برنامه‌ای ثبت نشده.";

  return (
    <>
      {/* کارت آبی */}
      <section className="mt-5 rounded-3xl bg-[#087df0] p-5 text-white">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-bold">مراقبت امروزت، یکجا</h2>
          <span className="text-xs text-white/80">برای خودم</span>
        </div>
        <div className="mt-5 flex items-end justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-white/90">{heroLine}</p>
            <div
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/30"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
            >
              <div
                className="h-full rounded-full bg-white transition-all duration-500"
                style={{ width: percent + "%" }}
              />
            </div>
          </div>
          <div className="text-left">
            <p className="text-[32px] font-extrabold leading-none">
              {total ? toFa(taken) + " از " + toFa(total) : "—"}
            </p>
            <p className="mt-1 text-xs text-white/80">نوبت مصرف شده</p>
          </div>
        </div>
      </section>

      {/* نوبت بعدی */}
      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-base font-bold">نوبت بعدی مصرف</h2>
        <Link href="/schedule" className="text-sm text-[#1583db]">
          برنامه امروز
        </Link>
      </div>

      {next ? (
        <section className="mt-3 rounded-3xl bg-white p-4 shadow-[0_1px_0_#e6eef9]">
          <div className="flex items-start gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#e8f2fe] text-[#1583db]">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2.5" y="8.5" width="19" height="7" rx="3.5" transform="rotate(-45 12 12)" />
                <path d="M9 9l6 6" />
              </svg>
            </span>
            <div className="flex-1">
              <p className="text-base font-bold">{next.name}</p>
              <p className="mt-1 text-xs text-[#5b6f8f]">{next.subtitle}</p>
            </div>
            <div className="text-left">
              <p className="text-lg font-extrabold">{toFa(next.time)}</p>
              <p className="mt-1 text-xs text-[#5b6f8f]">{toFa(next.pills)} {next.unit}</p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-[#5b6f8f]">نوبت امروز</span>
            <span className="rounded-full bg-[#e8f2fe] px-3 py-1 text-xs font-semibold text-[#1583db]">
              در انتظار مصرف
            </span>
          </div>

          <button
            type="button"
            onClick={() => confirm(next)}
            disabled={busyKey !== null}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#087df0] text-base font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
          >
            ثبت مصرف
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="5 12.5 10 17.5 19 7" />
            </svg>
          </button>
          <p role="alert" className="min-h-5 pt-2 text-center text-xs text-red-500">
            {error}
          </p>
        </section>
      ) : (
        <section className="mt-3 rounded-3xl bg-white p-5 text-center text-sm leading-7 text-[#5b6f8f] shadow-[0_1px_0_#e6eef9]">
          {total ? (
            "نوبت مصرف دیگری برای امروز نمانده است."
          ) : (
            <>
              برای امروز دارویی نداری.{" "}
              <Link href="/medicines/new" className="font-semibold text-[#1583db]">
                افزودن دارو
              </Link>
            </>
          )}
        </section>
      )}
    </>
  );
}