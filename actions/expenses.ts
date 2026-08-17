"use server";

import type { ExpenseCategory, ExpenseType, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/session";
import { expenseSchema, type ExpenseInput } from "@/schemas";
import type { ActionResult } from "@/types";

export interface ExpenseFilters {
  type?: ExpenseType;
  category?: ExpenseCategory;
  from?: Date | string;
  to?: Date | string;
}

const fail = (error: unknown): ActionResult<never> => {
  console.error("Expense action failed:", error);
  return { success: false, error: "Unable to complete the expense operation." };
};

async function validateRelations(companyId: string, data: ExpenseInput) {
  const checks = await Promise.all([
    data.tripId ? prisma.trip.count({ where: { id: data.tripId, companyId } }) : 1,
    data.vehicleId ? prisma.vehicle.count({ where: { id: data.vehicleId, companyId } }) : 1,
    data.driverId ? prisma.driver.count({ where: { id: data.driverId, companyId } }) : 1,
  ]);
  return checks.every(Boolean);
}

export async function createExpense(input: ExpenseInput): Promise<ActionResult<{ id: string }>> {
  const user = await requireCompany();
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Please correct the expense details.", errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  try {
    if (!(await validateRelations(user.companyId, parsed.data))) return { success: false, error: "A linked trip, vehicle, or driver is invalid." };
    const expense = await prisma.expense.create({ data: { ...parsed.data, companyId: user.companyId, createdById: user.id } });
    await createAuditLog({ action: "CREATE", entity: "Expense", entityId: expense.id, details: `Created expense ${expense.title}`, userId: user.id, companyId: user.companyId });
    revalidatePath("/expenses");
    return { success: true, data: { id: expense.id } };
  } catch (error) { return fail(error); }
}

export async function updateExpense(id: string, input: ExpenseInput): Promise<ActionResult<{ id: string }>> {
  const user = await requireCompany();
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Please correct the expense details.", errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  try {
    const existing = await prisma.expense.findFirst({ where: { id, companyId: user.companyId }, select: { id: true } });
    if (!existing) return { success: false, error: "Expense not found." };
    if (!(await validateRelations(user.companyId, parsed.data))) return { success: false, error: "A linked trip, vehicle, or driver is invalid." };
    const expense = await prisma.expense.update({ where: { id }, data: parsed.data });
    await createAuditLog({ action: "UPDATE", entity: "Expense", entityId: id, details: `Updated expense ${expense.title}`, userId: user.id, companyId: user.companyId });
    revalidatePath("/expenses");
    return { success: true, data: { id } };
  } catch (error) { return fail(error); }
}

export async function deleteExpense(id: string): Promise<ActionResult<{ id: string }>> {
  const user = await requireCompany();
  try {
    const expense = await prisma.expense.findFirst({ where: { id, companyId: user.companyId }, select: { id: true, title: true } });
    if (!expense) return { success: false, error: "Expense not found." };
    await prisma.expense.delete({ where: { id } });
    await createAuditLog({ action: "DELETE", entity: "Expense", entityId: id, details: `Deleted expense ${expense.title}`, userId: user.id, companyId: user.companyId });
    revalidatePath("/expenses");
    return { success: true, data: { id } };
  } catch (error) { return fail(error); }
}

export async function getExpenses(filters: ExpenseFilters = {}) {
  const user = await requireCompany();
  const where: Prisma.ExpenseWhereInput = {
    companyId: user.companyId,
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.from || filters.to ? { date: { ...(filters.from ? { gte: new Date(filters.from) } : {}), ...(filters.to ? { lte: new Date(filters.to) } : {}) } } : {}),
  };
  try {
    const data = await prisma.expense.findMany({
      where,
      include: { vehicle: { select: { id: true, number: true } }, driver: { select: { id: true, name: true } }, trip: { select: { id: true, tripNumber: true } } },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 150,
    });
    return { success: true, data } satisfies ActionResult<typeof data>;
  } catch (error) { return fail(error); }
}

export async function getExpenseById(id: string) {
  const user = await requireCompany();
  try {
    const data = await prisma.expense.findFirst({ where: { id, companyId: user.companyId }, include: { vehicle: true, driver: true, trip: true } });
    return data ? { success: true, data } : { success: false, error: "Expense not found." };
  } catch (error) { return fail(error); }
}
