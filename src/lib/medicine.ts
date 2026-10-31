// ثابت‌های مشترک بین فرم، API و صفحه‌ی خانه (بدون وابستگی به سرور)

export const FORM_VALUES = ["TABLET", "CAPSULE", "SYRUP", "DROP", "INJECTION", "SACHET"] as const;
export type FormValue = (typeof FORM_VALUES)[number];

export const FORM_INFO: Record<FormValue, { label: string; unit: string }> = {
  TABLET: { label: "قرص", unit: "قرص" },
  CAPSULE: { label: "کپسول", unit: "کپسول" },
  SYRUP: { label: "شربت", unit: "قاشق" },
  DROP: { label: "قطره", unit: "قطره" },
  INJECTION: { label: "آمپول", unit: "آمپول" },
  SACHET: { label: "ساشه", unit: "ساشه" },
};

export const UNIT_VALUES = ["mg", "g", "mcg", "iu", "ml", "percent"] as const;
export type UnitValue = (typeof UNIT_VALUES)[number];

export const UNIT_LABEL: Record<UnitValue, string> = {
  mg: "میلی‌گرم",
  g: "گرم",
  mcg: "میکروگرم",
  iu: "واحد",
  ml: "میلی‌لیتر",
  percent: "درصد",
};

export const INTERVAL_OPTIONS = [
  { value: 1, label: "هر روز" },
  { value: 2, label: "یک روز در میان" },
  { value: 3, label: "هر ۳ روز" },
  { value: 7, label: "هفته‌ای یکبار" },
] as const;

export const DURATION_OPTIONS = [
  { value: 0, label: "بدون تاریخ پایان" },
  { value: 7, label: "۷ روز" },
  { value: 10, label: "۱۰ روز" },
  { value: 14, label: "۱۴ روز" },
  { value: 30, label: "۳۰ روز" },
  { value: 90, label: "۹۰ روز" },
] as const;

export const MAX_TIMES = 4;

// پیشنهاد نام در فرم (بدون درخواست شبکه)؛ کاربر می‌تواند هر نام دیگری بنویسد
export const DRUG_NAMES = [
  "آتورواستاتین", "روزواستاتین", "سیمواستاتین", "متفورمین", "گلی‌بنکلامید", "گلیمپیراید",
  "آملودیپین", "لوزارتان", "والسارتان", "انالاپریل", "کاپتوپریل", "لیزینوپریل",
  "متوپرولول", "آتنولول", "بیزوپرولول", "فوروزماید", "هیدروکلروتیازید", "اسپیرونولاکتون",
  "آسپیرین", "کلوپیدوگرل", "وارفارین", "امپرازول", "پنتوپرازول", "رانیتیدین",
  "لووتیروکسین", "پردنیزولون", "سالبوتامول", "لوراتادین", "ستیریزین", "استامینوفن",
  "ایبوپروفن", "ناپروکسن", "دیکلوفناک", "آموکسی‌سیلین", "آزیترومایسین", "سفیکسیم",
  "سیپروفلوکساسین", "ویتامین دی۳", "ویتامین ب۱۲", "اسید فولیک", "آهن", "کلسیم", "منیزیم", "زینک",
];