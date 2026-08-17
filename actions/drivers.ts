"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/session";
import { driverSchema, type DriverInput } from "@/schemas";
import type { ActionResult } from "@/types";

const include = { currentVehicles: { select: { id: true, number: true } } } as const;
const BULK_DELETE_BATCH_SIZE = 50;
const DELETE_TRANSACTION_OPTIONS = { maxWait: 10_000, timeout: 60_000 };

const fail = (error: unknown): ActionResult<never> => {
  console.error("Driver action failed:", error);
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2028") {
    return { success: false, error: "Delete took too long. Please try again with fewer drivers selected." };
  }
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
  const result = await deleteDrivers([id]);
  if (!result.success) return { success: false, error: result.error, errors: result.errors };
  return { success: true, data: { id } };
}

export async function deleteDrivers(ids: string[]): Promise<ActionResult<{ count: number }>> {
  const user = await requireCompany();
  const uniqueIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  if (!uniqueIds.length) return { success: false, error: "Select at least one driver." };

  try {
    const drivers = await prisma.driver.findMany({
      where: { id: { in: uniqueIds }, companyId: user.companyId },
      select: { id: true, name: true },
    });
    if (!drivers.length) return { success: false, error: "No matching drivers found." };

    const driverIds = drivers.map((driver) => driver.id);
    for (let index = 0; index < driverIds.length; index += BULK_DELETE_BATCH_SIZE) {
      const batch = driverIds.slice(index, index + BULK_DELETE_BATCH_SIZE);
      await prisma.$transaction(async (tx) => {
        await tx.vehicle.updateMany({
          where: { currentDriverId: { in: batch }, companyId: user.companyId },
          data: { currentDriverId: null },
        });
        await tx.trip.updateMany({
          where: { driverId: { in: batch }, companyId: user.companyId },
          data: { driverId: null },
        });
        await tx.expense.updateMany({
          where: { driverId: { in: batch }, companyId: user.companyId },
          data: { driverId: null },
        });
        await tx.attendance.deleteMany({ where: { driverId: { in: batch } } });
        await tx.driver.deleteMany({ where: { id: { in: batch }, companyId: user.companyId } });
      }, DELETE_TRANSACTION_OPTIONS);
    }

    const preview = drivers.slice(0, 20).map((driver) => driver.name).join(", ");
    await createAuditLog({
      action: "DELETE",
      entity: "Driver",
      entityId: driverIds[0],
      details: `Bulk deleted ${drivers.length} drivers${preview ? `: ${preview}` : ""}${drivers.length > 20 ? "…" : ""}`,
      userId: user.id,
      companyId: user.companyId,
    });
    revalidatePath("/drivers");
    revalidatePath("/vehicles");
    revalidatePath("/trips");
    return { success: true, data: { count: drivers.length } };
  } catch (error) {
    return fail(error);
  }
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
