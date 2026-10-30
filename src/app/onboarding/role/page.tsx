import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import RoleForm from "./role-form";

export const metadata = {
  title: "انتخاب نقش | دوزوا",
};

async function Content() {
  const user = await requireUser();
  if (user.onboardedAt) redirect("/home");
  return <RoleForm initialRole={user.role} />;
}

export default function RolePage() {
  return (
    <Suspense
      fallback={<main className="min-h-dvh bg-gradient-to-b from-[#e8f2fe] via-[#f5f9ff] to-white" />}
    >
      <Content />
    </Suspense>
  );
}