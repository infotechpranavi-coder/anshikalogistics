"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { registerSchema, type RegisterInput } from "@/schemas";
import type { ActionResult } from "@/types";

export async function registerUser(
  input: RegisterInput
): Promise<ActionResult<{ userId: string; companyId: string }>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please correct the registration details.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const email = parsed.data.email.trim().toLowerCase();
  try {
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) return { success: false, error: "An account with this email already exists." };

    const password = await bcrypt.hash(parsed.data.password, 12);
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: parsed.data.companyName.trim(),
          phone: parsed.data.phone?.trim() || null,
        },
      });
      const user = await tx.user.create({
        data: {
          name: parsed.data.name.trim(),
          email,
          password,
          phone: parsed.data.phone?.trim() || null,
          role: "ADMIN",
          companyId: company.id,
        },
      });
      return { user, company };
    });

    await createAuditLog({
      action: "REGISTER",
      entity: "User",
      entityId: result.user.id,
      details: `Created company ${result.company.name}`,
      userId: result.user.id,
      companyId: result.company.id,
    });

    return {
      success: true,
      data: { userId: result.user.id, companyId: result.company.id },
    };
  } catch (error) {
    console.error("Registration failed:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, error: "An account with this email already exists." };
    }
    return { success: false, error: "Unable to create your account. Please try again." };
  }
}
