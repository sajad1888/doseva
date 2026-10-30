"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";

// بعد از تأیید موفق به این مسیرها می‌رود؛ هر وقت صفحه‌هایشان را ساختید عوض کنید.
const NEW_USER_PATH = "/onboarding/role";
const EXISTING_USER_PATH = "/home";

const LENGTH = 6;
const DEFAULT_RESEND_SECONDS = 60;

const toFa = (s: string) => s.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
const toLatin = (s: string) =>
  s
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));

type Props = { type: "phone" | "email"; value: string };

export default function VerifyForm({ type, value }: Props) {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(DEFAULT_RESEND_SECONDS);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const submitting = useRef(false);

  const isPhone = type === "phone";
  const complete = digits.every(Boolean);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  async function submit(code: string) {
    if (submitting.current) return;
    submitting.current = true;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, value, code }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error?.message ?? "مشکلی پیش آمد. دوباره تلاش کنید.");
        setDigits(Array(LENGTH).fill(""));
        inputs.current[0]?.focus();
        return;
      }
      router.replace(data.needsOnboarding ? NEW_USER_PATH : EXISTING_USER_PATH);;
      router.refresh();
    } catch {
      setError("اتصال برقرار نشد. اینترنت خود را بررسی کنید.");
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  function fill(start: number, raw: string) {
    const chars = toLatin(raw).replace(/\D/g, "").slice(0, LENGTH - start).split("");
    if (!chars.length) return;
    const next = [...digits];
    chars.forEach((c, k) => (next[start + k] = c));
    setDigits(next);
    setError("");
    const focusAt = Math.min(start + chars.length, LENGTH - 1);
    inputs.current[focusAt]?.focus();
    if (next.every(Boolean)) submit(next.join(""));
  }

  function onChange(i: number, raw: string) {
    if (!raw) {
      const next = [...digits];
      next[i] = "";
      setDigits(next);
      return;
    }
    fill(i, raw);
  }

  function onKeyDown(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < LENGTH - 1) inputs.current[i + 1]?.focus();
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    fill(0, e.clipboardData.getData("text"));
  }

  async function resend() {
    if (seconds > 0) return;
    setError("");
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, value }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setSeconds(data?.resendAfter ?? DEFAULT_RESEND_SECONDS);
        setDigits(Array(LENGTH).fill(""));
        inputs.current[0]?.focus();
      } else {
        if (data?.error?.retryAfter) setSeconds(data.error.retryAfter);
        setError(data?.error?.message ?? "ارسال مجدد انجام نشد.");
      }
    } catch {
      setError("اتصال برقرار نشد. اینترنت خود را بررسی کنید.");
    }
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <main
      dir="rtl"
      className="min-h-dvh bg-linear-to-b from-[#e8f2fe] via-[#f5f9ff] to-white font-[Vazirmatn,IRANSans,Vazir,system-ui,sans-serif] text-[#0b2a5b]"
    >
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-6 pt-6">
        <header className="flex justify-end">
          <Link
            href="/login"
            aria-label="بازگشت"
            className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-[#0b2a5b]/5 focus-visible:outline-2 focus-visible:outline-[#1583db]"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 6 9 12 15 18" />
            </svg>
          </Link>
        </header>

        <div className="mt-10 text-center">
          <h1 className="text-[28px] font-extrabold">
            {isPhone ? "تایید شماره تماس" : "تایید ایمیل"}
          </h1>
          <p className="mt-5 text-[15px] leading-8 text-[#1b2a41]">
            کد تایید ۶ رقمی به{" "}
            <span dir="ltr" className="inline-block font-bold">
              {isPhone ? toFa(value) : value}
            </span>{" "}
            ارسال شد.
          </p>
          <Link href="/login" className="mt-1 inline-block text-sm text-[#1583db]">
            {isPhone ? "ویرایش شماره" : "ویرایش ایمیل"}
          </Link>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (complete) submit(digits.join(""));
          }}
          className="mt-12 flex flex-1 flex-col"
        >
          <div dir="ltr" className="flex justify-center gap-2" role="group" aria-label="کد تایید">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                aria-label={`رقم ${toFa(String(i + 1))}`}
                value={d ? toFa(d) : ""}
                onChange={(e) => onChange(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                onPaste={onPaste}
                onFocus={(e) => e.target.select()}
                disabled={loading}
                className={`h-14 w-12 rounded-2xl border bg-white text-center text-xl font-bold outline-none transition focus:border-[#1583db] focus:ring-2 focus:ring-[#1583db]/20 disabled:opacity-60 ${
                  error ? "border-red-400" : d ? "border-[#1583db]" : "border-[#dce7f5]"
                }`}
              />
            ))}
          </div>

          <p role="alert" className="mt-4 min-h-6 text-center text-sm text-red-500">
            {error}
          </p>

          <div className="mt-4 text-center text-[15px]">
            {seconds > 0 ? (
              <span className="text-[#5b6f8f]">
                ارسال مجدد کد تا <span dir="ltr" className="inline-block font-bold">{toFa(`${mm}:${ss}`)}</span>
              </span>
            ) : (
              <button type="button" onClick={resend} className="font-semibold text-[#1583db]">
                ارسال مجدد کد
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={!complete || loading}
            className="mt-auto h-13 w-full rounded-full bg-[#1583db] text-lg font-bold text-white transition hover:bg-[#1175c4] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#0b2a5b]"
          >
            {loading ? "در حال بررسی…" : "تایید و ادامه"}
          </button>
        </form>
      </div>
    </main>
  );
}
