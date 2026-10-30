import Link from "next/link";

export const metadata = {
  title: "صفحه پیدا نشد | دوزوا",
};

export default function NotFound() {
  return (
    <main
      dir="rtl"
      className="grid min-h-dvh place-items-center bg-linear-to-b from-[#dcebfb] via-[#f4f8fe] to-white p-6 text-center font-[Vazirmatn,IRANSans,Vazir,system-ui,sans-serif] text-[#0b2a5b]"
    >
      {/* <style>{{
        @keyframes doseva-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(6deg); }
        }
      }}</style> */}

      <div className="flex w-full max-w-90 flex-col items-center">
        <div
          aria-hidden="true"
          dir="ltr"
          className="flex items-center justify-center gap-1 text-[clamp(88px,28vw,120px)] font-extrabold leading-none"
        >
          <span>۴</span>
          <svg
            viewBox="0 0 120 120"
            role="img"
            aria-label="قرص"
            className="h-[1em] w-[1em] shrink-0 motion-safe:animate-[doseva-float_3.2s_ease-in-out_infinite]"
          >
            <g transform="rotate(-45 60 60)">
              <rect x="14" y="36" width="92" height="48" rx="24" fill="#fff" />
              <path d="M60 36h22a24 24 0 0 1 0 48H60z" fill="#1E7FD8" />
              <rect x="14" y="36" width="92" height="48" rx="24" fill="none" stroke="#1E7FD8" strokeWidth="5" />
              <rect x="26" y="45" width="22" height="7" rx="3.5" fill="#1E7FD8" opacity=".18" />
            </g>
          </svg>
          <span>۴</span>
        </div>

        <h1 className="mb-2 mt-7 text-[22px] font-bold">صفحه پیدا نشد</h1>
        <p className="mb-8 text-sm leading-8 text-[#5b6f8f]">
          آدرسی که وارد کردید وجود ندارد یا جابه‌جا شده است. به صفحه اصلی
          برگردید و برنامه مصرف داروهایتان را ادامه دهید.
        </p>

        <Link
          href="/"
          className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#1e7fd8] text-[15px] font-semibold text-white transition hover:bg-[#1a6dbb] active:scale-[0.98] focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#0b2a5b]"
        >
          بازگشت به خانه
        </Link>
      </div>
    </main>
  );
}