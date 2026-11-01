"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { ScheduleData, ScheduleLog, ScheduleMed } from "@/lib/schedule";
import { addDaysIso, isDueOn, tehranParts, toFa } from "@/lib/time";
import {
  jalaliDayMonth,
  jalaliDayNumber,
  jalaliMonthYear,
  weekdayName,
} from "@/lib/jalali";

type RowState = "TAKEN" | "NEXT" | "OVERDUE" | "UPCOMING" | "MISSED";
type Row = {
  key: string;
  med: ScheduleMed;
  time: string;
  state: RowState;
  takenTime: string | null;
};

const SELF = "self";
const CARD = "rounded-3xl bg-white p-4 shadow-[0_1px_0_#e6eef9]";

const BADGE: Record<RowState, { cls: string; label: string }> = {
  TAKEN: { cls: "bg-[#e6f6ee] text-[#1e9e6a]", label: "مصرف شد" },
  NEXT: { cls: "bg-[#e8f2fe] text-[#1583db]", label: "نوبت بعدی" },
  OVERDUE: { cls: "bg-amber-50 text-amber-700", label: "از دست رفته" },
  UPCOMING: { cls: "bg-[#e8f2fe] text-[#1583db]", label: "پیش رو" },
  MISSED: { cls: "bg-[#eef1f6] text-[#7b8ba6]", label: "ثبت نشده" },
};

function Icon({ children, className = "h-5 w-5" }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export default function ScheduleView({ data }: { data: ScheduleData }) {
  const router = useRouter();
  const { today, rangeFrom, rangeTo, members, meds } = data;

  const [person, setPerson] = useState(SELF);
  const [selected, setSelected] = useState(today);
  const [nowTime, setNowTime] = useState(data.nowTime);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  // وقتی بعد از router.refresh داده‌ی تازه می‌رسد، جایگزین می‌شود
  const [logs, setLogs] = useState<ScheduleLog[]>(data.logs);
  const [prevLogs, setPrevLogs] = useState(data.logs);
  if (data.logs !== prevLogs) {
    setPrevLogs(data.logs);
    setLogs(data.logs);
  }

  const startRef = useRef<HTMLButtonElement>(null);

  // ساعت «اکنون» هر دقیقه تازه می‌شود
  useEffect(() => {
    const t = setInterval(() => setNowTime(tehranParts().time), 60000);
    return () => clearInterval(t);
  }, []);

  // نوار روزها را طوری بچرخان که دیروز اول و امروز دومی دیده شود
  useEffect(() => {
    startRef.current?.scrollIntoView({ inline: "start", block: "nearest" });
  }, []);

  const personId = person === SELF ? null : person;
  const people = [{ id: SELF, name: "خودم" }, ...members];

  const days = useMemo(() => {
    const out: string[] = [];
    for (let d = rangeFrom; d <= rangeTo; d = addDaysIso(d, 1)) out.push(d);
    return out;
  }, [rangeFrom, rangeTo]);

  const logMap = useMemo(
    () => new Map(logs.map((l) => [l.date + "|" + l.medicineId + "|" + l.time, l.takenAt])),
    [logs]
  );

  const personMeds = useMemo(() => meds.filter((m) => m.memberId === personId), [meds, personId]);

  const daysWithDoses = useMemo(() => {
    const set = new Set<string>();
    for (const d of days) if (personMeds.some((m) => isDueOn(m, d))) set.add(d);
    return set;
  }, [days, personMeds]);

  const rows = useMemo(() => {
    const list: Row[] = [];
    for (const m of personMeds) {
      if (!isDueOn(m, selected)) continue;
      for (const time of m.times) {
        const takenAt = logMap.get(selected + "|" + m.id + "|" + time);
        list.push({
          key: m.id + "|" + time,
          med: m,
          time,
          state: "UPCOMING",
          takenTime: takenAt ? tehranParts(new Date(takenAt)).time : null,
        });
      }
    }
    list.sort((a, b) => a.time.localeCompare(b.time) || a.med.name.localeCompare(b.med.name));

    let nextAssigned = false;
    for (const r of list) {
      if (r.takenTime) r.state = "TAKEN";
      else if (selected > today) r.state = "UPCOMING";
      else if (selected < today) r.state = "MISSED";
      else if (r.time < nowTime) r.state = "OVERDUE";
      else if (!nextAssigned) {
        r.state = "NEXT";
        nextAssigned = true;
      } else r.state = "UPCOMING";
    }
    return list;
  }, [personMeds, selected, logMap, today, nowTime]);

  const total = rows.length;
  const taken = rows.filter((r) => r.state === "TAKEN").length;

  const dayLabel =
    (selected === today
      ? "امروز، "
      : selected === addDaysIso(today, 1)
        ? "فردا، "
        : selected === addDaysIso(today, -1)
          ? "دیروز، "
          : "") +
    weekdayName(selected) +
    " " +
    jalaliDayMonth(selected);

  async function confirm(r: Row) {
    if (busyKey) return;
    setBusyKey(r.key);
    setError("");

    const optimistic: ScheduleLog = {
      medicineId: r.med.id,
      date: today,
      time: r.time,
      takenAt: new Date().toISOString(),
    };
    setLogs((prev) => [...prev, optimistic]); // فوری نشان بده

    let message = "اتصال برقرار نشد. دوباره تلاش کنید.";
    try {
      const res = await fetch("/api/doses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicineId: r.med.id, time: r.time }),
      });
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        message = body?.error?.message ?? "ثبت مصرف انجام نشد.";
        throw new Error(message);
      }
      router.refresh();
    } catch {
      setLogs((prev) => prev.filter((l) => l !== optimistic));
      setError(message);
    } finally {
      setBusyKey(null);
    }
  }

  const startDay = addDaysIso(today, -1);

  return (
    <>
      <header className="flex items-center gap-3">
        <Link
          href="/home"
          aria-label="بازگشت"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white shadow-[0_1px_0_#e6eef9]"
        >
          <Icon><polyline points="9 6 15 12 9 18" /></Icon>
        </Link>
        <div className="flex-1">
          <h1 className="text-[22px] font-extrabold">برنامه مصرف</h1>
          <p className="mt-1 text-xs text-[#5b6f8f]">{jalaliMonthYear(selected)}</p>
        </div>
        <div className="relative">
          <button
            type="button"
            aria-label="گزینه‌ها"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white shadow-[0_1px_0_#e6eef9]"
          >
            <Icon>
              <circle cx="5" cy="12" r="1" />
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
            </Icon>
          </button>
          {menuOpen && (
            <>
              <button
                type="button"
                aria-label="بستن منو"
                onClick={() => setMenuOpen(false)}
                className="fixed inset-0 z-10 cursor-default"
              />
              <ul className="absolute left-0 top-full z-20 mt-2 w-44 overflow-hidden rounded-2xl border border-[#dce7f5] bg-white text-sm shadow-lg">
                <li>
                  <Link href="/medicines/new" className="block px-4 py-3 hover:bg-[#f1f6fd]">
                    افزودن دارو
                  </Link>
                </li>
                <li>
                  <Link href="/medicines" className="block px-4 py-3 hover:bg-[#f1f6fd]">
                    داروهای من
                  </Link>
                </li>
              </ul>
            </>
          )}
        </div>
      </header>

      {/* خودم و اعضای خانواده */}
      <div
        role="tablist"
        aria-label="برنامه‌ی چه کسی"
        className="mt-5 flex gap-1 overflow-x-auto rounded-2xl bg-[#e3edf9] p-1 scrollbar-none [&::-webkit-scrollbar]:hidden"
      >
        {people.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={person === p.id}
            onClick={() => {
              setPerson(p.id);
              setError("");
            }}
            className={
              "h-12 min-w-24 flex-1 shrink-0 rounded-xl px-3 text-sm transition " +
              (person === p.id ? "bg-white font-bold text-[#1583db] shadow-sm" : "text-[#7b8ba6]")
            }
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* نوار روزها */}
      <div
        role="listbox"
        aria-label="روز"
        className="mt-4 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 scrollbar-none [&::-webkit-scrollbar]:hidden"
      >
        {days.map((d) => {
          const active = d === selected;
          return (
            <button
              key={d}
              ref={d === startDay ? startRef : undefined}
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => {
                setSelected(d);
                setError("");
              }}
              className={
                "flex w-[calc((100%-2rem)/5)] shrink-0 snap-start flex-col items-center gap-1 rounded-2xl py-3 transition " +
                (active ? "bg-[#087df0] text-white" : "bg-white text-[#5b6f8f] shadow-[0_1px_0_#e6eef9]")
              }
            >
              <span className="text-xs">{weekdayName(d)}</span>
              <span className={"text-2xl font-extrabold " + (active ? "" : "text-[#0b2a5b]")}>
                {jalaliDayNumber(d)}
              </span>
              <span
                className={
                  "h-1.5 w-1.5 rounded-full " +
                  (daysWithDoses.has(d) ? (active ? "bg-white" : "bg-[#1583db]/40") : "bg-transparent")
                }
              />
            </button>
          );
        })}
      </div>

      {/* عنوان روز و خلاصه */}
      <div className="mt-4 flex items-center justify-between gap-2">
        <h2 className="text-base font-bold">{dayLabel}</h2>
        {total > 0 && (
          <span
            className={
              "rounded-full px-3 py-1 text-xs font-semibold " +
              (selected > today ? "bg-[#e8f2fe] text-[#1583db]" : "bg-[#e6f6ee] text-[#1e9e6a]")
            }
          >
            {selected > today
              ? toFa(total) + " نوبت برنامه‌ریزی شده"
              : toFa(taken) + " از " + toFa(total) + " نوبت ثبت شده"}
          </span>
        )}
      </div>

      {/* نوبت‌ها */}
      {total === 0 ? (
        <p className={CARD + " mt-3 text-center text-sm leading-7 text-[#5b6f8f]"}>
          برای این روز نوبت مصرفی ثبت نشده است.{" "}
          <Link href="/medicines/new" className="font-semibold text-[#1583db]">
            افزودن دارو
          </Link>
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {rows.map((r) => {
            const badge = BADGE[r.state];
            const isTaken = r.state === "TAKEN";
            const canLog = r.state === "NEXT" || r.state === "OVERDUE";
            return (
              <li key={r.key} className={CARD}>
                <Link href={"/medicines/" + r.med.id} className="block">
                  <div className="flex items-start gap-3">
                    <span
                      className={
                        "grid h-12 w-12 shrink-0 place-items-center rounded-2xl " +
                        (isTaken ? "bg-[#e6f6ee] text-[#1e9e6a]" : "bg-[#e8f2fe] text-[#1583db]")
                      }
                    >
                      <Icon className="h-6 w-6">
                        <rect x="2.5" y="8.5" width="19" height="7" rx="3.5" transform="rotate(-45 12 12)" />
                        <path d="M9 9l6 6" />
                      </Icon>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-bold">{r.med.name}</p>
                      {r.med.dosage && <p className="mt-1 text-xs text-[#5b6f8f]">{r.med.dosage}</p>}
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-extrabold">{toFa(r.time)}</p>
                      <p className="mt-1 text-xs text-[#5b6f8f]">
                        {toFa(r.med.pills) + " " + r.med.unit}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-[#5b6f8f]">
                      {toFa(r.med.pills) + " " + r.med.unit + (isTaken ? " ثبت شده" : "")}
                    </span>
                    <span className={"rounded-full px-3 py-1 text-xs font-semibold " + badge.cls}>
                      {isTaken && r.takenTime ? badge.label + " • " + toFa(r.takenTime) : badge.label}
                    </span>
                  </div>
                </Link>
                {canLog && (
                  <button
                    type="button"
                    onClick={() => confirm(r)}
                    disabled={busyKey !== null}
                    className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#087df0] text-base font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
                  >
                    ثبت مصرف
                    <Icon><polyline points="5 12.5 10 17.5 19 7" /></Icon>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p role="alert" className="min-h-5 pt-3 text-center text-xs text-red-500">
        {error}
      </p>
      {total > 0 && (
        <p className="pt-1 text-center text-xs text-[#5b6f8f]">
          برای دیدن جزئیات، دارو را انتخاب کنید.
        </p>
      )}
    </>
  );
}