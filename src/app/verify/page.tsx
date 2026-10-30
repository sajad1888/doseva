import { Suspense } from "react";
import { redirect } from "next/navigation";
import VerifyForm from "../api/VerifyForm";

export const metadata = {
  title: "تایید شماره تماس | دوزوا",
};

type SearchParams = Promise<{ phone?: string; email?: string }>;

// خواندن searchParams داده‌ی زمان اجراست و باید داخل Suspense باشد
async function VerifyContent({ searchParams }: { searchParams: SearchParams }) {
  const { phone, email } = await searchParams;

  if (phone) return <VerifyForm type="phone" value={phone} />;
  if (email) return <VerifyForm type="email" value={email} />;

  redirect("/login");
}

export default function VerifyPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense
      fallback={
        <main className="min-h-dvh bg-linear-to-b from-[#e8f2fe] via-[#f5f9ff] to-white" />
      }
    >
      <VerifyContent searchParams={searchParams} />
    </Suspense>
  );
}
