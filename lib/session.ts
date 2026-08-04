import { auth } from "@/lib/auth";
import { hasPermission } from "@/types";
import type { Role } from "@prisma/client";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requirePermission(permission: string) {
  const user = await requireAuth();
  if (!hasPermission(user.role as Role, permission)) {
    redirect("/dashboard");
  }
  return user;
}

export async function requireCompany() {
  const user = await requireAuth();
  if (!user.companyId) {
    redirect("/settings");
  }
  return user as typeof user & { companyId: string };
}
