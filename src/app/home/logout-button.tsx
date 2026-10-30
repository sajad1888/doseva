"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className="mt-8 h-12 w-full rounded-full border border-[#1583db] font-semibold text-[#1583db] transition hover:bg-[#1583db]/5 disabled:opacity-60"
    >
      {loading ? "در حال خروج…" : "خروج از حساب"}
    </button>
  );
}