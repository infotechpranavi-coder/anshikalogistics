"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/session";
import { vehicleSchema, type VehicleInput } from "@/schemas";
import type { ActionResult } from "@/types";

const include = { currentDriver: { select: { id: true, name: true, phone: true } } } as const;

function fail(error: unknown): ActionResult<never> {
  console.error("Vehicle action failed:", error);
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
    return { success: false, error: "A vehicle with this number already exists." };
  return { success: false, error: "Unable to complete the vehicle operation." };
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
  const user = await requireCompany();
  try {
    const vehicle = await prisma.vehicle.findFirst({ where: { id, companyId: user.companyId }, select: { id: true, number: true, _count: { select: { trips: true, expenses: true } } } });
    if (!vehicle) return { success: false, error: "Vehicle not found." };
    if (vehicle._count.trips || vehicle._count.expenses) return { success: false, error: "Vehicle has linked trips or expenses and cannot be deleted." };
    await prisma.vehicle.delete({ where: { id } });
    await createAuditLog({ action: "DELETE", entity: "Vehicle", entityId: id, details: `Deleted vehicle ${vehicle.number}`, userId: user.id, companyId: user.companyId });
    revalidatePath("/vehicles");
    return { success: true, data: { id } };
  } catch (error) { return fail(error); }
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
