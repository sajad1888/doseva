"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { JALALI_MONTHS } from "@/lib/jalali";
import {
  DRUG_NAMES,
  DURATION_OPTIONS,
  FORM_INFO,
  FORM_VALUES,
  INTERVAL_OPTIONS,
  MAX_TIMES,
  UNIT_LABEL,
  UNIT_VALUES,
  type FormValue,
  type UnitValue,
} from "@/lib/medicine";
import { toFa, toLatinDigits } from "@/lib/time";

type Props = {
  members: { id: string; name: string }[];
  today: { y: number; m: number; d: number };
};

const NEW_MEMBER = "__new";
const BOX =
  "h-14 w-full rounded-2xl border border-[#dce7f5] bg-white text-base outline-none transition focus-within:border-[#1583db] focus-within:ring-2 focus-within:ring-[#1583db]/20";
const SELECT =
  "h-14 w-full appearance-none rounded-2xl border border-[#dce7f5] bg-white pl-10 pr-4 text-base outline-none transition focus:border-[#1583db] focus:ring-2 focus:ring-[#1583db]/20";

const norm = (s: string) => s.replace(/ي/g, "ی").replace(/ك/g, "ک").trim();

function Icon({ children, className = "h-5 w-5" }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

const Chevron = () => (
  <Icon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8a9ab3]">
    <polyline points="6 9 12 15 18 9" />
  </Icon>
);

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-bold">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function MedicineForm({ members, today }: Props) {
  const router = useRouter();

  const [forWhom, setForWhom] = useState<"self" | "family">("self");
  const [memberId, setMemberId] = useState(members[0]?.id ?? NEW_MEMBER);
  const [newMemberName, setNewMemberName] = useState("");

  const [name, setName] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);
  const [strengthValue, setStrengthValue] = useState("");
  const [strengthUnit, setStrengthUnit] = useState<UnitValue>("mg");
  const [form, setForm] = useState<FormValue>("TABLET");
  const [intervalDays, setIntervalDays] = useState(1);
  const [pills, setPills] = useState(1);
  const [times, setTimes] = useState<string[]>(["08:00"]);
  const [sy, setSy] = useState(today.y);
  const [sm, setSm] = useState(today.m);
  const [sd, setSd] = useState(today.d);
  const [duration, setDuration] = useState(0);
  const [stock, setStock] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const unit = FORM_INFO[form].unit;
  const usingNewMember = forWhom === "family" && (members.length === 0 || memberId === NEW_MEMBER);

  const suggestions = useMemo(() => {
    const q = norm(name);
    if (!q) return [];
    return DRUG_NAMES.filter((d) => d.includes(q) && d !== q).slice(0, 5);
  }, [name]);

  const maxDay = sm <= 6 ? 31 : 30;
  const years = [today.y - 1, today.y, today.y + 1];

  function setNum(set: (v: string) => void, v: string, decimal = false) {
    const latin = toLatinDigits(v);
    set(decimal ? latin.replace(/[^\d.]/g, "") : latin.replace(/\D/g, ""));
    setError("");
  }

  function validate(): string | null {
    if (norm(name).length < 2) return "نام دارو را وارد کنید.";
    if (strengthValue && !/^\d{1,5}(\.\d{1,2})?$/.test(strengthValue)) return "قدرت دارو را درست وارد کنید.";
    if (times.some((t) => !t)) return "ساعت یادآوری را وارد کنید.";
    if (new Set(times).size !== times.length) return "ساعت‌های یادآوری تکراری است.";
    if (usingNewMember && newMemberName.trim().length < 2) return "نام عضو خانواده را وارد کنید.";
    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/medicines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          forWhom,
          memberId: forWhom === "family" && !usingNewMember ? memberId : undefined,
          newMemberName: usingNewMember ? newMemberName.trim() : undefined,
          name: norm(name),
          strengthValue: strengthValue || undefined,
          strengthUnit: strengthValue ? strengthUnit : undefined,
          form,
          intervalDays,
          pillsPerDose: pills,
          times,
          start: { y: sy, m: sm, d: sd },
          durationDays: duration || null,
          stock: stock === "" ? null : Number(stock),
        }),
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

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push("/home");
  }

  return (
    <main
      dir="rtl"
      className="min-h-dvh bg-[#f4f8fe] font-[Vazirmatn,IRANSans,Vazir,system-ui,sans-serif] text-[#0b2a5b]"
    >
      <form onSubmit={onSubmit} noValidate className="mx-auto w-full max-w-md px-5 pb-44 pt-6">
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={goBack}
            aria-label="بازگشت"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white shadow-[0_1px_0_#e6eef9]"
          >
            <Icon className="h-5 w-5"><polyline points="9 6 15 12 9 18" /></Icon>
          </button>
          <div className="flex-1">
            <h1 className="text-[22px] font-extrabold">افزودن دارو</h1>
            <p className="mt-1 text-xs text-[#5b6f8f]">اطلاعات مطابق نسخه شما</p>
          </div>
          <Link
            href="/home"
            aria-label="بستن"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white shadow-[0_1px_0_#e6eef9]"
          >
            <Icon className="h-5 w-5"><path d="M6 6l12 12M18 6L6 18" /></Icon>
          </Link>
        </header>

        {/* برای خودم / برای خانواده */}
        <div role="tablist" aria-label="دارو برای چه کسی" className="mt-5 grid grid-cols-2 gap-1 rounded-2xl bg-[#e3edf9] p-1">
          {(
            [
              ["self", "برای خودم"],
              ["family", "برای خانواده"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={forWhom === value}
              onClick={() => {
                setForWhom(value);
                setError("");
              }}
              className={
                "h-12 rounded-xl text-sm transition " +
                (forWhom === value ? "bg-white font-bold text-[#1583db] shadow-sm" : "text-[#7b8ba6]")
              }
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-5">
          {forWhom === "family" && (
            <>
              {members.length > 0 && (
                <Field label="برای چه کسی؟" htmlFor="member">
                  <div className="relative">
                    <select id="member" value={memberId} onChange={(e) => setMemberId(e.target.value)} className={SELECT}>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                      <option value={NEW_MEMBER}>عضو جدید…</option>
                    </select>
                    <Chevron />
                  </div>
                </Field>
              )}
              {usingNewMember && (
                <Field label="نام عضو خانواده" htmlFor="newMember">
                  <input
                    id="newMember"
                    type="text"
                    maxLength={40}
                    placeholder="مثلاً مادر"
                    value={newMemberName}
                    onChange={(e) => {
                      setNewMemberName(e.target.value);
                      setError("");
                    }}
                    className={BOX + " px-4 placeholder:text-[#8a9ab3]"}
                  />
                </Field>
              )}
            </>
          )}

          {/* نام دارو */}
          <Field label="نام دارو" htmlFor="name">
            <div className="relative">
              <input
                id="name"
                type="text"
                autoComplete="off"
                maxLength={80}
                placeholder="مثلاً آتورواستاتین"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setShowSuggest(true);
                  setError("");
                }}
                onFocus={() => setShowSuggest(true)}
                onBlur={() => setShowSuggest(false)}
                className={BOX + " pl-11 pr-4 placeholder:text-[#8a9ab3]"}
              />
              <Icon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8a9ab3]">
                <circle cx="11" cy="11" r="6.5" />
                <path d="M16 16l4 4" />
              </Icon>
              {showSuggest && suggestions.length > 0 && (
                <ul className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-2xl border border-[#dce7f5] bg-white shadow-lg">
                  {suggestions.map((s) => (
                    <li key={s}>
                      <button
                        type="button"
                        onPointerDown={(e) => {
                          e.preventDefault();
                          setName(s);
                          setShowSuggest(false);
                        }}
                        className="block w-full px-4 py-3 text-right text-sm hover:bg-[#f1f6fd]"
                      >
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Field>

          {/* قدرت و شکل */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="قدرت دارو" htmlFor="strength">
              <div className={BOX + " flex items-center gap-1 px-3"}>
                <input
                  id="strength"
                  type="text"
                  inputMode="decimal"
                  maxLength={8}
                  placeholder="۲۰"
                  value={toFa(strengthValue)}
                  onChange={(e) => setNum(setStrengthValue, e.target.value, true)}
                  className="w-12 bg-transparent text-center outline-none placeholder:text-[#8a9ab3]"
                />
                <div className="relative min-w-0 flex-1">
                  <select
                    aria-label="واحد قدرت دارو"
                    value={strengthUnit}
                    onChange={(e) => setStrengthUnit(e.target.value as UnitValue)}
                    className="w-full appearance-none bg-transparent pl-6 text-sm outline-none"
                  >
                    {UNIT_VALUES.map((u) => (
                      <option key={u} value={u}>{UNIT_LABEL[u]}</option>
                    ))}
                  </select>
                  <Icon className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a9ab3]">
                    <polyline points="6 9 12 15 18 9" />
                  </Icon>
                </div>
              </div>
            </Field>

            <Field label="شکل دارو" htmlFor="form">
              <div className="relative">
                <select id="form" value={form} onChange={(e) => setForm(e.target.value as FormValue)} className={SELECT}>
                  {FORM_VALUES.map((f) => (
                    <option key={f} value={f}>{FORM_INFO[f].label}</option>
                  ))}
                </select>
                <Chevron />
              </div>
            </Field>
          </div>

          {/* تکرار و مقدار */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="تکرار مصرف" htmlFor="interval">
              <div className="relative">
                <select id="interval" value={intervalDays} onChange={(e) => setIntervalDays(Number(e.target.value))} className={SELECT}>
                  {INTERVAL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <Chevron />
              </div>
            </Field>

            <Field label="مقدار هر نوبت">
              <div className={BOX + " flex items-center justify-between px-3"}>
                <span className="text-base">{toFa(pills) + " " + unit}</span>
                <span className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="کم کردن مقدار"
                    onClick={() => setPills((p) => Math.max(1, p - 1))}
                    disabled={pills <= 1}
                    className="grid h-8 w-8 place-items-center rounded-full bg-[#eef6ff] text-[#1583db] disabled:opacity-40"
                  >
                    <Icon className="h-4 w-4"><path d="M6 12h12" /></Icon>
                  </button>
                  <button
                    type="button"
                    aria-label="زیاد کردن مقدار"
                    onClick={() => setPills((p) => Math.min(20, p + 1))}
                    disabled={pills >= 20}
                    className="grid h-8 w-8 place-items-center rounded-full bg-[#eef6ff] text-[#1583db] disabled:opacity-40"
                  >
                    <Icon className="h-4 w-4"><path d="M12 6v12M6 12h12" /></Icon>
                  </button>
                </span>
              </div>
            </Field>
          </div>

          {/* ساعت یادآوری */}
          <div>
            <span className="mb-2 block text-sm font-bold">ساعت یادآوری</span>
            <div className="flex flex-col gap-2">
              {times.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="time"
                      aria-label={"ساعت یادآوری " + toFa(i + 1)}
                      dir="ltr"
                      value={t}
                      onChange={(e) => {
                        const v = e.target.value;
                        setTimes((prev) => prev.map((x, k) => (k === i ? v : x)));
                        setError("");
                      }}
                      className={SELECT + " text-right"}
                    />
                    <Icon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8a9ab3]">
                      <circle cx="12" cy="12" r="8.5" />
                      <path d="M12 7.5V12l3 2" />
                    </Icon>
                  </div>
                  {times.length > 1 && (
                    <button
                      type="button"
                      aria-label="حذف این ساعت"
                      onClick={() => setTimes((prev) => prev.filter((_, k) => k !== i))}
                      className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-[#7b8ba6] shadow-[0_1px_0_#e6eef9]"
                    >
                      <Icon className="h-4 w-4"><path d="M6 6l12 12M18 6L6 18" /></Icon>
                    </button>
                  )}
                </div>
              ))}
            </div>
            {times.length < MAX_TIMES && (
              <button
                type="button"
                onClick={() => setTimes((prev) => [...prev, "20:00"])}
                className="mt-2 text-sm font-semibold text-[#1583db]"
              >
                + افزودن ساعت دیگر
              </button>
            )}
          </div>

          {/* شروع و پایان */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="شروع برنامه">
              <div className={BOX + " flex items-center gap-0.5 px-3 text-sm"}>
                <select
                  aria-label="روز"
                  value={Math.min(sd, maxDay)}
                  onChange={(e) => setSd(Number(e.target.value))}
                  className="appearance-none bg-transparent outline-none"
                >
                  {Array.from({ length: maxDay }, (_, k) => k + 1).map((d) => (
                    <option key={d} value={d}>{toFa(d)}</option>
                  ))}
                </select>
                <select
                  aria-label="ماه"
                  value={sm}
                  onChange={(e) => {
                    const m = Number(e.target.value);
                    setSm(m);
                    if (m > 6 && sd > 30) setSd(30);
                  }}
                  className="appearance-none bg-transparent outline-none"
                >
                  {JALALI_MONTHS.map((n, k) => (
                    <option key={n} value={k + 1}>{n}</option>
                  ))}
                </select>
                <select
                  aria-label="سال"
                  value={sy}
                  onChange={(e) => setSy(Number(e.target.value))}
                  className="appearance-none bg-transparent outline-none"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{toFa(y)}</option>
                  ))}
                </select>
                <Icon className="mr-auto h-4 w-4 shrink-0 text-[#8a9ab3]">
                  <rect x="4" y="5" width="16" height="15" rx="2" />
                  <path d="M4 10h16M8 3v4M16 3v4" />
                </Icon>
              </div>
            </Field>

            <Field label="پایان برنامه" htmlFor="duration">
              <div className="relative">
                <select id="duration" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={SELECT + " text-sm"}>
                  {DURATION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <Chevron />
              </div>
            </Field>
          </div>

          {/* موجودی */}
          <Field label="موجودی فعلی (اختیاری)" htmlFor="stock">
            <div className={BOX + " flex items-center gap-2 px-4"}>
              <input
                id="stock"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="۳۰"
                value={toFa(stock)}
                onChange={(e) => setNum(setStock, e.target.value)}
                className="w-20 bg-transparent outline-none placeholder:text-[#8a9ab3]"
              />
              <span className="flex-1 text-base text-[#5b6f8f]">{unit}</span>
              <Icon className="h-5 w-5 shrink-0 text-[#8a9ab3]">
                <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
                <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
              </Icon>
            </div>
          </Field>

          <p className="text-xs leading-6 text-[#5b6f8f]">
            مقدار هر نوبت، تعداد مصرف است؛ موجودی، تعداد {unit}‌های باقی‌مانده شماست.
          </p>
        </div>

        {/* دکمه ثابت پایین */}
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#e6eef9] bg-[#f4f8fe]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          <div className="mx-auto w-full max-w-md px-5 pb-3 pt-2">
            <p role="alert" className="min-h-6 pb-1 text-center text-sm text-red-500">
              {error}
            </p>
            <button
              type="submit"
              disabled={loading}
              className="h-14 w-full rounded-2xl bg-[#087df0] text-base font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? "در حال ذخیره…" : "ذخیره دارو و فعال‌کردن یادآوری"}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}