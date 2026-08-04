"use server";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";
import { userSchema, type UserInput } from "@/schemas";
import type { ActionResult } from "@/types";

const publicSelect = { id: true, name: true, email: true, phone: true, role: true, isActive: true, image: true, createdAt: true, updatedAt: true } as const;
const fail = (error: unknown): ActionResult<never> => {
  console.error("User action failed:", error);
  return { success: false, error: "Unable to complete the user operation. The email may already be in use." };
};

export async function getUsers() {
  const user = await requirePermission("users:read");
  if (!user.companyId) return { success: false, error: "Company not found." };
  try {
    const data = await prisma.user.findMany({ where: { companyId: user.companyId }, select: publicSelect, orderBy: { name: "asc" } });
    return { success: true, data } satisfies ActionResult<typeof data>;
  } catch (error) { return fail(error); }
}

export async function createUser(input: UserInput): Promise<ActionResult<{ id: string }>> {
  const admin = await requirePermission("users:*");
  if (!admin.companyId) return { success: false, error: "Company not found." };
  const parsed = userSchema.safeParse(input);
  if (!parsed.success || !parsed.data.password) return { success: false, error: "A valid password is required.", errors: parsed.success ? { password: ["Password is required."] } : parsed.error.flatten().fieldErrors as Record<string, string[]> };
  try {
    const created = await prisma.user.create({ data: { ...parsed.data, password: await hash(parsed.data.password, 12), email: parsed.data.email.toLowerCase(), companyId: admin.companyId } });
    await createAuditLog({ action: "CREATE", entity: "User", entityId: created.id, details: `Created user ${created.email}`, userId: admin.id, companyId: admin.companyId });
    revalidatePath("/users");
    return { success: true, data: { id: created.id } };
  } catch (error) { return fail(error); }
}

export async function updateUser(id: string, input: UserInput): Promise<ActionResult<{ id: string }>> {
  const admin = await requirePermission("users:*");
  if (!admin.companyId) return { success: false, error: "Company not found." };
  const parsed = userSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Please correct the user details.", errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  try {
    const existing = await prisma.user.findFirst({ where: { id, companyId: admin.companyId }, select: { id: true } });
    if (!existing) return { success: false, error: "User not found." };
    const { password, ...data } = parsed.data;
    await prisma.user.update({ where: { id }, data: { ...data, email: data.email.toLowerCase(), ...(password ? { password: await hash(password, 12) } : {}) } });
    await createAuditLog({ action: "UPDATE", entity: "User", entityId: id, details: `Updated user ${data.email}`, userId: admin.id, companyId: admin.companyId });
    revalidatePath("/users");
    return { success: true, data: { id } };
  } catch (error) { return fail(error); }
}

export async function deleteUser(id: string): Promise<ActionResult<{ id: string }>> {
  const admin = await requirePermission("users:*");
  if (!admin.companyId) return { success: false, error: "Company not found." };
  if (id === admin.id) return { success: false, error: "You cannot delete your own account." };
  try {
    const existing = await prisma.user.findFirst({ where: { id, companyId: admin.companyId }, select: { id: true, email: true, _count: { select: { trips: true, expenses: true } } } });
    if (!existing) return { success: false, error: "User not found." };
    if (existing._count.trips || existing._count.expenses) {
      await prisma.user.update({ where: { id }, data: { isActive: false } });
    } else {
      await prisma.$transaction([prisma.notification.deleteMany({ where: { userId: id } }), prisma.session.deleteMany({ where: { userId: id } }), prisma.account.deleteMany({ where: { userId: id } }), prisma.user.delete({ where: { id } })]);
    }
    await createAuditLog({ action: "DELETE", entity: "User", entityId: id, details: `Removed user ${existing.email}`, userId: admin.id, companyId: admin.companyId });
    revalidatePath("/users");
    return { success: true, data: { id } };
  } catch (error) { return fail(error); }
}
