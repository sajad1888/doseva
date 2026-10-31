import nodemailer from "nodemailer";
import type { IdentifierType } from "./identifier";

/** ارسال کد تأیید. در حالت توسعه فقط در ترمینال چاپ می‌شود. */
export async function sendOtp(type: IdentifierType, to: string, code: string) {
  if (process.env.NODE_ENV !== "production" || process.env.OTP_LOG === "true") {
    console.log(`[OTP] ${to} → ${code}`);
    return;
  }

  if (type === "phone") {
    // نمونه: کاوه‌نگار (verify/lookup). برای سرویس دیگر فقط همین بخش را عوض کنید.
    const url = new URL(
      `https://api.kavenegar.com/v1/${process.env.KAVENEGAR_API_KEY}/verify/lookup.json`
    );
    url.search = new URLSearchParams({
      receptor: to,
      token: code,
      template: process.env.KAVENEGAR_TEMPLATE!,
    }).toString();
    const res = await fetch(url);
    if (!res.ok) throw new Error(`SMS failed: ${res.status}`);
    return;
  }

  const transporter = nodemailer.createTransport(process.env.SMTP_URL!);
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: "کد ورود به دوزوا",
    text: `کد ورود شما: ${code}\nاین کد ۲ دقیقه معتبر است.`,
  });
}
