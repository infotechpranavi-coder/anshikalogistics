"use server";

import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/session";
import { driverSchema, type DriverInput } from "@/schemas";
import type { ActionResult } from "@/types";

const include = { currentVehicles: { select: { id: true, number: true } } } as const;
const fail = (error: unknown): ActionResult<never> => {
  console.error("Driver action failed:", error);
  return { success: false, error: "Unable to complete the driver operation." };
};

export async function createDriver(input: DriverInput): Promise<ActionResult<{ id: string }>> {
  const user = await requireCompany();
  const parsed = driverSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Please correct the driver details.", errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  try {
    const driver = await prisma.driver.create({ data: { ...parsed.data, companyId: user.companyId } });
    await createAuditLog({ action: "CREATE", entity: "Driver", entityId: driver.id, details: `Created driver ${driver.name}`, userId: user.id, companyId: user.companyId });
    revalidatePath("/drivers");
    return { success: true, data: { id: driver.id } };
  } catch (error) { return fail(error); }
}

export async function updateDriver(id: string, input: DriverInput): Promise<ActionResult<{ id: string }>> {
  const user = await requireCompany();
  const parsed = driverSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Please correct the driver details.", errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  try {
    const driver = await prisma.driver.findFirst({ where: { id, companyId: user.companyId }, select: { id: true } });
    if (!driver) return { success: false, error: "Driver not found." };
    const updated = await prisma.driver.update({ where: { id }, data: parsed.data });
    await createAuditLog({ action: "UPDATE", entity: "Driver", entityId: id, details: `Updated driver ${updated.name}`, userId: user.id, companyId: user.companyId });
    revalidatePath("/drivers"); revalidatePath(`/drivers/${id}`);
    return { success: true, data: { id } };
  } catch (error) { return fail(error); }
}

export async function deleteDriver(id: string): Promise<ActionResult<{ id: string }>> {
  const user = await requireCompany();
  try {
    const driver = await prisma.driver.findFirst({ where: { id, companyId: user.companyId }, select: { id: true, name: true, _count: { select: { trips: true, expenses: true, currentVehicles: true } } } });
    if (!driver) return { success: false, error: "Driver not found." };
    if (driver._count.trips || driver._count.expenses || driver._count.currentVehicles) return { success: false, error: "Driver has linked records and cannot be deleted." };
    await prisma.driver.delete({ where: { id } });
    await createAuditLog({ action: "DELETE", entity: "Driver", entityId: id, details: `Deleted driver ${driver.name}`, userId: user.id, companyId: user.companyId });
    revalidatePath("/drivers");
    return { success: true, data: { id } };
  } catch (error) { return fail(error); }
}

export async function getDrivers(options: { search?: string; active?: boolean } = {}) {
  const user = await requireCompany();
  const search = options.search?.trim();
  try {
    const data = await prisma.driver.findMany({
      where: { companyId: user.companyId, ...(typeof options.active === "boolean" ? { isActive: options.active } : {}), ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { phone: { contains: search, mode: "insensitive" } }, { licenseNumber: { contains: search, mode: "insensitive" } }] } : {}) },
      include, orderBy: { name: "asc" },
    });
    return { success: true, data } satisfies ActionResult<typeof data>;
  } catch (error) { return fail(error); }
}

export async function getDriverById(id: string) {
  const user = await requireCompany();
  try {
    const data = await prisma.driver.findFirst({ where: { id, companyId: user.companyId }, include });
    return data ? { success: true, data } : { success: false, error: "Driver not found." };
  } catch (error) { return fail(error); }
}
