"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Role = "PATIENT" | "PATIENT_WITH_CAREGIVER" | "CAREGIVER";

const OPTIONS: { value: Role; title: string; desc: string }[] = [
  { value: "PATIENT", title: "بیمارم", desc: "داروهای خودم را مدیریت می‌کنم" },
  {
    value: "PATIENT_WITH_CAREGIVER",
    title: "بیماری که مراقب دارد",
    desc: "مراقبم می‌تواند وضعیت مصرف داروهایم را ببیند",
  },
  {
    value: "CAREGIVER",
    title: "کسی که از بیمار مراقبت می‌کند",
    desc: "داروهای فرد دیگری را پیگیری می‌کنم",
  },
];

export default function RoleForm({ initialRole }: { initialRole: Role | null }) {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(initialRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!role || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
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
      router.push("/onboarding/profile");
    } catch {
      setError("اتصال برقرار نشد. اینترنت خود را بررسی کنید.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="min-h-dvh bg-gradient-to-b from-[#e8f2fe] via-[#f5f9ff] to-white font-[Vazirmatn,IRANSans,Vazir,system-ui,sans-serif] text-[#0b2a5b]"
    >
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-6 pt-14">
        <div className="text-center">
          <h1 className="text-[28px] font-extrabold">انتخاب نقش</h1>
          <p className="mt-4 text-[15px] leading-8 text-[#1b2a41]">
            مشخص کنید کدام نقش به شما نزدیک‌تر است. بعداً هم می‌توانید آن را تغییر دهید.
          </p>
        </div>

        <div role="radiogroup" aria-label="نقش" className="mt-10 flex flex-col gap-3">
          {OPTIONS.map((o) => {
            const active = o.value === role;
            return (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  setRole(o.value);
                  setError("");
                }}
                className={
                  "flex w-full items-center gap-3 rounded-2xl border p-4 text-right transition " +
                  (active
                    ? "border-[#1583db] bg-[#eef6ff]"
                    : "border-[#dce7f5] bg-white hover:border-[#b9d3f0]")
                }
              >
                <span
                  className={
                    "grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 " +
                    (active ? "border-[#1583db]" : "border-[#c4d3e8]")
                  }
                >
                  {active && <span className="h-2.5 w-2.5 rounded-full bg-[#1583db]" />}
                </span>
                <span className="flex-1">
                  <span className="block text-[15px] font-bold">{o.title}</span>
                  <span className="mt-0.5 block text-xs leading-6 text-[#5b6f8f]">{o.desc}</span>
                </span>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#dcebfb] text-[#1583db]">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
                  </svg>
                </span>
              </button>
            );
          })}
        </div>

        <p role="alert" className="mt-4 min-h-6 text-center text-sm text-red-500">
          {error}
        </p>

        <button
          type="button"
          onClick={submit}
          disabled={!role || loading}
          className="mt-auto h-[52px] w-full rounded-full bg-[#1583db] text-lg font-bold text-white transition hover:bg-[#1175c4] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "در حال ذخیره…" : "ادامه"}
        </button>
      </div>
    </main>
  );
}