import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "./session";

/** کاربر واردشده را برمی‌گرداند؛ اگر وارد نشده بود به /login می‌فرستد. */
export async function requireUser() {
  const id = await getSessionUserId();
  if (!id) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) redirect("/login");

  return user;
}