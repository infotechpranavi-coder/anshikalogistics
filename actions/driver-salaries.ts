"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/session";
import {
  driverSalaryPaymentSchema,
  type DriverSalaryPaymentInput,
} from "@/schemas";
import type { ActionResult } from "@/types";

const fail = (error: unknown): ActionResult<never> => {
  console.error("Driver salary action failed:", error);
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return { success: false, error: "Salary for this month is already recorded." };
  }
  return { success: false, error: "Unable to complete the salary operation." };
};

export async function getDriverSalaryPayments(driverId: string) {
  const user = await requireCompany();
  try {
    const driver = await prisma.driver.findFirst({
      where: { id: driverId, companyId: user.companyId },
      select: { id: true, name: true, salary: true },
    });
    if (!driver) return { success: false as const, error: "Driver not found." };

    const payments = await prisma.driverSalaryPayment.findMany({
      where: { driverId, companyId: user.companyId },
      orderBy: [{ month: "desc" }, { paidDate: "desc" }],
      select: {
        id: true,
        month: true,
        paidDate: true,
        amount: true,
        notes: true,
        createdAt: true,
      },
    });

    return {
      success: true as const,
      data: { driver, payments },
    };
  } catch (error) {
    return fail(error);
  }
}

export async function recordDriverSalaryPayment(
  input: DriverSalaryPaymentInput
): Promise<ActionResult<{ id: string }>> {
  const user = await requireCompany();
  const parsed = driverSalaryPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please correct the salary details.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const driver = await prisma.driver.findFirst({
      where: { id: parsed.data.driverId, companyId: user.companyId },
      select: { id: true, name: true },
    });
    if (!driver) return { success: false, error: "Driver not found." };

    const payment = await prisma.driverSalaryPayment.upsert({
      where: {
        driverId_month: {
          driverId: parsed.data.driverId,
          month: parsed.data.month,
        },
      },
      create: {
        driverId: parsed.data.driverId,
        companyId: user.companyId,
        month: parsed.data.month,
        paidDate: parsed.data.paidDate,
        amount: parsed.data.amount,
        notes: parsed.data.notes?.trim() || null,
      },
      update: {
        paidDate: parsed.data.paidDate,
        amount: parsed.data.amount,
        notes: parsed.data.notes?.trim() || null,
      },
    });

    await createAuditLog({
      action: "UPDATE",
      entity: "DriverSalaryPayment",
      entityId: payment.id,
      details: `Recorded salary ${parsed.data.amount} for ${driver.name} (${parsed.data.month})`,
      userId: user.id,
      companyId: user.companyId,
    });

    revalidatePath("/drivers");
    revalidatePath(`/drivers/${parsed.data.driverId}`);
    return { success: true, data: { id: payment.id } };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteDriverSalaryPayment(
  id: string
): Promise<ActionResult<{ id: string }>> {
  const user = await requireCompany();
  try {
    const payment = await prisma.driverSalaryPayment.findFirst({
      where: { id, companyId: user.companyId },
      select: { id: true, driverId: true, month: true },
    });
    if (!payment) return { success: false, error: "Salary payment not found." };

    await prisma.driverSalaryPayment.delete({ where: { id } });
    await createAuditLog({
      action: "DELETE",
      entity: "DriverSalaryPayment",
      entityId: id,
      details: `Deleted salary payment for month ${payment.month}`,
      userId: user.id,
      companyId: user.companyId,
    });

    revalidatePath("/drivers");
    revalidatePath(`/drivers/${payment.driverId}`);
    return { success: true, data: { id } };
  } catch (error) {
    return fail(error);
  }
}
