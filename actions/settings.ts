"use server";

import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { requireCompany, requirePermission } from "@/lib/session";
import { companySettingsSchema, type CompanySettingsInput } from "@/schemas";
import type { ActionResult } from "@/types";

export async function getCompanySettings() {
  const user = await requireCompany();
  try {
    const data = await prisma.company.findUnique({ where: { id: user.companyId } });
    return data ? { success: true, data } : { success: false, error: "Company not found." };
  } catch (error) {
    console.error("Get settings failed:", error);
    return { success: false, error: "Unable to load company settings." };
  }
}

export async function updateCompanySettings(input: CompanySettingsInput): Promise<ActionResult<{ id: string }>> {
  const user = await requirePermission("settings:*");
  if (!user.companyId) return { success: false, error: "Company not found." };
  const parsed = companySettingsSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Please correct the company details.", errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  try {
    await prisma.company.update({ where: { id: user.companyId }, data: parsed.data });
    await createAuditLog({ action: "UPDATE", entity: "Company", entityId: user.companyId, details: "Updated company settings", userId: user.id, companyId: user.companyId });
    revalidatePath("/settings");
    return { success: true, data: { id: user.companyId } };
  } catch (error) {
    console.error("Update settings failed:", error);
    return { success: false, error: "Unable to update company settings." };
  }
}
