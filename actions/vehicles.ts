"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/session";
import { vehicleSchema, type VehicleInput } from "@/schemas";
import type { ActionResult } from "@/types";

const include = { currentDriver: { select: { id: true, name: true, phone: true } } } as const;

const BULK_DELETE_BATCH_SIZE = 50;
const DELETE_TRANSACTION_OPTIONS = { maxWait: 10_000, timeout: 60_000 };

function fail(error: unknown): ActionResult<never> {
  console.error("Vehicle action failed:", error);
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
    return { success: false, error: "A vehicle with this number already exists." };
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2028") {
    return { success: false, error: "Delete took too long. Please try again with fewer vehicles selected." };
  }
  return { success: false, error: "Unable to complete the vehicle operation." };
}

async function deleteRelatedTrips(
  tx: Prisma.TransactionClient,
  tripIds: string[],
  companyId: string
) {
  if (!tripIds.length) return;
  const invoices = await tx.invoice.findMany({
    where: { tripId: { in: tripIds }, companyId },
    select: { id: true },
  });
  const invoiceIds = invoices.map((invoice) => invoice.id);
  await tx.payment.deleteMany({
    where: {
      companyId,
      OR: [
        { tripId: { in: tripIds } },
        ...(invoiceIds.length ? [{ invoiceId: { in: invoiceIds } }] : []),
      ],
    },
  });
  await tx.expense.deleteMany({ where: { tripId: { in: tripIds }, companyId } });
  await tx.invoice.deleteMany({ where: { tripId: { in: tripIds }, companyId } });
  await tx.trip.deleteMany({ where: { id: { in: tripIds }, companyId } });
}

export async function createVehicle(input: VehicleInput): Promise<ActionResult<{ id: string }>> {
  const user = await requireCompany();
  const parsed = vehicleSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Please correct the vehicle details.", errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  try {
    if (parsed.data.currentDriverId) {
      const driver = await prisma.driver.findFirst({ where: { id: parsed.data.currentDriverId, companyId: user.companyId }, select: { id: true } });
      if (!driver) return { success: false, error: "Selected driver was not found." };
    }
    const vehicle = await prisma.vehicle.create({ data: { ...parsed.data, companyId: user.companyId } });
    await createAuditLog({ action: "CREATE", entity: "Vehicle", entityId: vehicle.id, details: `Created vehicle ${vehicle.number}`, userId: user.id, companyId: user.companyId });
    revalidatePath("/vehicles");
    return { success: true, data: { id: vehicle.id } };
  } catch (error) { return fail(error); }
}

export async function updateVehicle(id: string, input: VehicleInput): Promise<ActionResult<{ id: string }>> {
  const user = await requireCompany();
  const parsed = vehicleSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Please correct the vehicle details.", errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  try {
    const existing = await prisma.vehicle.findFirst({ where: { id, companyId: user.companyId }, select: { id: true } });
    if (!existing) return { success: false, error: "Vehicle not found." };
    if (parsed.data.currentDriverId) {
      const driver = await prisma.driver.findFirst({ where: { id: parsed.data.currentDriverId, companyId: user.companyId }, select: { id: true } });
      if (!driver) return { success: false, error: "Selected driver was not found." };
    }
    const vehicle = await prisma.vehicle.update({ where: { id }, data: parsed.data });
    await createAuditLog({ action: "UPDATE", entity: "Vehicle", entityId: id, details: `Updated vehicle ${vehicle.number}`, userId: user.id, companyId: user.companyId });
    revalidatePath("/vehicles"); revalidatePath(`/vehicles/${id}`);
    return { success: true, data: { id } };
  } catch (error) { return fail(error); }
}

export async function deleteVehicle(id: string): Promise<ActionResult<{ id: string }>> {
  const result = await deleteVehicles([id]);
  if (!result.success) return { success: false, error: result.error, errors: result.errors };
  return { success: true, data: { id } };
}

export async function deleteVehicles(ids: string[]): Promise<ActionResult<{ count: number }>> {
  const user = await requireCompany();
  const uniqueIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  if (!uniqueIds.length) return { success: false, error: "Select at least one vehicle." };

  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { id: { in: uniqueIds }, companyId: user.companyId },
      select: { id: true, number: true },
    });
    if (!vehicles.length) return { success: false, error: "No matching vehicles found." };

    const vehicleIds = vehicles.map((vehicle) => vehicle.id);
    for (let index = 0; index < vehicleIds.length; index += BULK_DELETE_BATCH_SIZE) {
      const batch = vehicleIds.slice(index, index + BULK_DELETE_BATCH_SIZE);
      await prisma.$transaction(async (tx) => {
        const trips = await tx.trip.findMany({
          where: { vehicleId: { in: batch }, companyId: user.companyId },
          select: { id: true },
        });
        await deleteRelatedTrips(tx, trips.map((trip) => trip.id), user.companyId);
        await tx.expense.deleteMany({ where: { vehicleId: { in: batch }, companyId: user.companyId } });
        await tx.vehicle.deleteMany({ where: { id: { in: batch }, companyId: user.companyId } });
      }, DELETE_TRANSACTION_OPTIONS);
    }

    const preview = vehicles.slice(0, 20).map((vehicle) => vehicle.number).join(", ");
    await createAuditLog({
      action: "DELETE",
      entity: "Vehicle",
      entityId: vehicleIds[0],
      details: `Bulk deleted ${vehicles.length} vehicles${preview ? `: ${preview}` : ""}${vehicles.length > 20 ? "…" : ""}`,
      userId: user.id,
      companyId: user.companyId,
    });
    revalidatePath("/vehicles");
    revalidatePath("/trips");
    revalidatePath("/invoices");
    return { success: true, data: { count: vehicles.length } };
  } catch (error) {
    return fail(error);
  }
}

export async function getVehicles(options: { search?: string; status?: VehicleInput["status"] } = {}) {
  const user = await requireCompany();
  const search = options.search?.trim();
  try {
    const data = await prisma.vehicle.findMany({
      where: { companyId: user.companyId, ...(options.status ? { status: options.status } : {}), ...(search ? { OR: [{ number: { contains: search, mode: "insensitive" } }, { make: { contains: search, mode: "insensitive" } }, { model: { contains: search, mode: "insensitive" } }] } : {}) },
      include, orderBy: { number: "asc" },
    });
    return { success: true, data } satisfies ActionResult<typeof data>;
  } catch (error) { return fail(error); }
}

export async function getVehicleById(id: string) {
  const user = await requireCompany();
  try {
    const data = await prisma.vehicle.findFirst({ where: { id, companyId: user.companyId }, include });
    return data ? { success: true, data } : { success: false, error: "Vehicle not found." };
  } catch (error) { return fail(error); }
}
