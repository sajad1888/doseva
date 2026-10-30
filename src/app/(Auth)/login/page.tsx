"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Method = "phone" | "email";

const toLatinDigits = (v: string) =>
  v
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));

const METHODS: Record<
  Method,
  {
    tab: string;
    label: string;
    placeholder: string;
    type: "tel" | "email";
    inputMode: "tel" | "email";
    autoComplete: string;
    error: string;
    isValid: (v: string) => boolean;
  }
> = {
  phone: {
    tab: "شماره تماس",
    label: "شماره تماس",
    placeholder: "۰۹۱۲ ۳۴۵ ۶۷۸۹",
    type: "tel",
    inputMode: "tel",
    autoComplete: "tel",
    error: "شماره تماس را به‌صورت ۰۹۱۲۳۴۵۶۷۸۹ وارد کنید.",
    isValid: (v) => /^09\d{9}$/.test(toLatinDigits(v).replace(/\s/g, "")),
  },
  email: {
    tab: "ایمیل",
    label: "ایمیل",
    placeholder: "name@example.com",
    type: "email",
    inputMode: "email",
    autoComplete: "email",
    error: "ایمیل معتبر وارد کنید.",
    isValid: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
  },
};

function Logo() {
  return (
    <svg viewBox="0 0 120 120" className="h-22 w-22" aria-hidden="true">
      <defs>
        <linearGradient id="capsule-light" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#b3dafc" />
          <stop offset="0.42" stopColor="#b3dafc" />
          <stop offset="0.42" stopColor="#1583db" />
        </linearGradient>
      </defs>
      <rect x="-35" y="-14" width="70" height="28" rx="14" fill="#1583db" transform="translate(62 82) rotate(45)" />
      <rect x="-35" y="-14" width="70" height="28" rx="14" fill="url(#capsule-light)" transform="translate(62 38) rotate(-45)" />
      <rect x="-22" y="-8" width="38" height="3.5" rx="1.75" fill="#fff" opacity=".55" transform="translate(64 38) rotate(-45)" />
      <rect x="-14" y="-8" width="38" height="3.5" rx="1.75" fill="#fff" opacity=".55" transform="translate(60 82) rotate(45)" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [method, setMethod] = useState<Method>("phone");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const current = METHODS[method];

  function switchMethod(next: Method) {
    setMethod(next);
    setValue("");
    setError("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (!current.isValid(value)) {
      setError(current.error);
      return;
    }
    const identifier = toLatinDigits(value).replace(/\s/g, "");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: method, value: identifier }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error?.message ?? "مشکلی پیش آمد. دوباره تلاش کنید.");
        return;
      }
      router.push(`/verify?${method}=${encodeURIComponent(identifier)}`);
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
        {/* در حالت RTL، justify-end یعنی سمت چپ */}
        <header className="flex justify-end">
          <Link
            href="/"
            aria-label="بازگشت"
            className="grid h-10 w-10 place-items-center rounded-full text-[#0b2a5b] transition hover:bg-[#0b2a5b]/5 focus-visible:outline-2 focus-visible:outline-[#1583db]"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 6 9 12 15 18" />
            </svg>
          </Link>
        </header>

        <div className="mt-6 flex flex-col items-center text-center">
          <Logo />
          <h1 className="mt-8 text-[28px] font-extrabold">ورود یا ثبت نام</h1>
          <p className="mt-6 text-[15px] text-[#1b2a41]">
            برای ادامه شماره همراه یا ایمیل خود را وارد کنید.
          </p>
        </div>

        <form onSubmit={onSubmit} noValidate className="mt-16 flex flex-1 flex-col">
          <div
            role="tablist"
            aria-label="روش ورود"
            className="grid grid-cols-2 gap-1 rounded-2xl border border-[#e1eaf6] bg-[#f1f6fd] p-0.5"
          >
            {(Object.keys(METHODS) as Method[]).map((m) => {
              const active = m === method;
              return (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => switchMethod(m)}
                  className={`h-12.5 rounded-[14px] text-base font-bold transition ${
                    active ? "bg-[#1583db] text-white" : "text-[#7b8ba6]"
                  }`}
                >
                  {METHODS[m].tab}
                </button>
              );
            })}
          </div>

          <label htmlFor="identifier" className="mb-3 mt-10 block text-lg font-bold">
            {current.label}
          </label>
          <input
            id="identifier"
            dir="ltr"
            type={current.type}
            inputMode={current.inputMode}
            autoComplete={current.autoComplete}
            placeholder={current.placeholder}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError("");
            }}
            aria-invalid={!!error}
            aria-describedby={error ? "identifier-error" : undefined}
            className={`h-14 w-full rounded-2xl border bg-white px-4 text-left text-base outline-none transition placeholder:text-[#8a9ab3] focus:border-[#1583db] focus:ring-2 focus:ring-[#1583db]/20 ${
              error ? "border-red-400" : "border-[#dce7f5]"
            }`}
          />
          {error && (
            <p id="identifier-error" role="alert" className="mt-2 text-sm text-red-500">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-auto disabled:opacity-60 h-13 w-full rounded-full bg-[#1583db] text-lg font-bold text-white transition hover:bg-[#1175c4] active:scale-[0.98]  focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#0b2a5b]"
          >
            {loading ? "در حال ارسال…" : "ادامه"}
          </button>
        </form>

        <Link href="/terms" className="mt-12 text-center text-[15px] text-[#1583db]">
          حریم خصوصی و شرایط استفاده
        </Link>
      </div>
    </main>
  );
}
