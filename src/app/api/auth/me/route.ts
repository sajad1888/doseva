import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail } from "@/lib/http";
import { getSessionUserId } from "@/lib/auth/session";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return fail(401, "UNAUTHENTICATED", "وارد حساب خود شوید.");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, phone: true, email: true },
  });
  if (!user) return fail(401, "UNAUTHENTICATED", "وارد حساب خود شوید.");

  return NextResponse.json({ ok: true, user });
}