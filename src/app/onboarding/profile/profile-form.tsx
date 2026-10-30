"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Initial = { fullName: string; birthDate: string; companionPhone: string };

const INPUT =
  "h-14 w-full rounded-2xl border border-[#dce7f5] bg-white px-4 text-base outline-none transition placeholder:text-[#8a9ab3] focus:border-[#1583db] focus:ring-2 focus:ring-[#1583db]/20";

export default function ProfileForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initial.fullName);
  const [birthDate, setBirthDate] = useState(initial.birthDate);
  const [companionPhone, setCompanionPhone] = useState(initial.companionPhone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;

    if (fullName.trim().length < 3) {
      setError("نام و نام خانوادگی را وارد کنید.");
      return;
    }
    if (!birthDate.trim()) {
      setError("تاریخ تولد را وارد کنید.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, birthDate, companionPhone }),
      });
      const data = await res.json().catch(() => null);
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (!res.ok) {
        setError(data?.error?.message ?? "مشکلی پیش آمد. دوباره تلاش کنید.");
        return;
      }
      router.replace("/home");
      router.refresh();
    } catch {
      setError("اتصال برقرار نشد. اینترنت خود را بررسی کنید.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="min-h-dvh bg-linear-to-b from-[#e8f2fe] via-[#f5f9ff] to-white font-[Vazirmatn,IRANSans,Vazir,system-ui,sans-serif] text-[#0b2a5b]"
    >
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-6 pt-6">
        <header className="flex justify-end">
          <Link
            href="/onboarding/role"
            aria-label="بازگشت"
            className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-[#0b2a5b]/5"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 6 9 12 15 18" />
            </svg>
          </Link>
        </header>

        <div className="mt-6 text-center">
          <h1 className="text-[28px] font-extrabold">اطلاعات تکمیلی</h1>
          <p className="mt-4 text-[15px] leading-8 text-[#1b2a41]">
            لطفاً اطلاعات زیر را تکمیل کنید.
          </p>
        </div>

        <form onSubmit={onSubmit} noValidate className="mt-10 flex flex-1 flex-col">
          <label htmlFor="fullName" className="mb-2 block text-base font-bold">
            نام و نام خانوادگی
          </label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            placeholder="مثال: علی محمدی"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              setError("");
            }}
            className={INPUT}
          />

          <label htmlFor="birthDate" className="mb-2 mt-6 block text-base font-bold">
            تاریخ تولد
          </label>
          <input
            id="birthDate"
            dir="ltr"
            type="text"
            placeholder="۱۳۷۰/۰۱/۰۱"
            value={birthDate}
            onChange={(e) => {
              setBirthDate(e.target.value);
              setError("");
            }}
            className={INPUT + " text-left"}
          />

          <label htmlFor="companionPhone" className="mb-2 mt-6 block text-base font-bold">
            شماره همراه (اختیاری)
          </label>
          <input
            id="companionPhone"
            dir="ltr"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            placeholder="۰۹۱۲ ۳۴۵ ۶۷۸۹"
            value={companionPhone}
            onChange={(e) => {
              setCompanionPhone(e.target.value);
              setError("");
            }}
            className={INPUT + " text-left"}
          />

          <p role="alert" className="mt-4 min-h-6 text-center text-sm text-red-500">
            {error}
          </p>

          <button
            type="submit"
            disabled={loading}
            className="mt-auto h-13 w-full rounded-full bg-[#1583db] text-lg font-bold text-white transition hover:bg-[#1175c4] active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? "در حال ذخیره…" : "ثبت و ادامه"}
          </button>
        </form>
      </div>
    </main>
  );
}