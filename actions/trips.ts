"use server";

import { Prisma, type TripStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/session";
import { tripSchema, type TripInput } from "@/schemas";
import type { ActionResult, PaginatedResult } from "@/types";
import { calculateTripTotals } from "@/utils/calculations";

export interface GetTripsOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: TripStatus;
}

function validationFailure(error: ReturnType<typeof tripSchema.safeParse>): ActionResult<never> {
  if (error.success) return { success: false, error: "Invalid trip data." };
  return {
    success: false,
    error: "Please correct the trip details.",
    errors: error.error.flatten().fieldErrors as Record<string, string[]>,
  };
}

function errorResult(error: unknown): ActionResult<never> {
  console.error("Trip action failed:", error);
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return { success: false, error: "Trip not found." };
  }
  return { success: false, error: "Unable to complete the trip operation." };
}

function computedTripData(data: TripInput) {
  const totals = calculateTripTotals({
    loadingKm: data.loadingKm,
    unloadingKm: data.unloadingKm,
    mileage: data.mileage,
    dieselRate: data.dieselRate,
    fuelFilled: data.fuelFilled,
    toll: data.toll,
    parking: data.parking,
    food: data.food,
    repair: data.repair,
    policeFine: data.policeFine,
    advance: data.advance,
    miscExpense: data.miscExpense,
    paidAmount: data.paidAmount,
  });
  return { ...data, ...totals };
}

export async function createTrip(input: TripInput): Promise<ActionResult<{ id: string; tripNumber: string }>> {
  const user = await requireCompany();
  const parsed = tripSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed);

  try {
    const data = computedTripData(parsed.data);
    const created = await prisma.$transaction(async (tx) => {
      const tripCount = await tx.trip.count({ where: { companyId: user.companyId } });
      const tripNumber = `TRP-${String(tripCount + 1).padStart(6, "0")}`;
      const trip = await tx.trip.create({
        data: {
          ...data,
          tripNumber,
          companyId: user.companyId,
          createdById: user.id,
        },
      });

      if (data.status === "COMPLETED") {
        const invoiceCount = await tx.invoice.count({ where: { companyId: user.companyId } });
        await tx.invoice.create({
          data: {
            invoiceNumber: `INV-${String(invoiceCount + 1).padStart(6, "0")}`,
            status: "GENERATED",
            subtotal: data.grandTotal,
            grandTotal: data.grandTotal,
            paidAmount: data.paidAmount,
            pendingAmount: data.pendingAmount,
            tripId: trip.id,
            companyId: user.companyId,
          },
        });
      }
      return trip;
    });

    await createAuditLog({
      action: "CREATE",
      entity: "Trip",
      entityId: created.id,
      details: `Created ${created.tripNumber} with status ${created.status}`,
      userId: user.id,
      companyId: user.companyId,
    });
    revalidatePath("/trips");
    return { success: true, data: { id: created.id, tripNumber: created.tripNumber } };
  } catch (error) {
    return errorResult(error);
  }
}

export async function updateTrip(
  id: string,
  input: TripInput
): Promise<ActionResult<{ id: string; tripNumber: string }>> {
  const user = await requireCompany();
  const parsed = tripSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed);

  try {
    const existing = await prisma.trip.findFirst({
      where: { id, companyId: user.companyId },
      select: { id: true, tripNumber: true },
    });
    if (!existing) return { success: false, error: "Trip not found." };

    const data = computedTripData(parsed.data);
    const updated = await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.update({ where: { id }, data });
      if (data.status === "COMPLETED") {
        const invoice = await tx.invoice.findUnique({ where: { tripId: id }, select: { id: true } });
        if (invoice) {
          await tx.invoice.update({
            where: { id: invoice.id },
            data: {
              status: "GENERATED",
              subtotal: data.grandTotal,
              grandTotal: data.grandTotal,
              paidAmount: data.paidAmount,
              pendingAmount: data.pendingAmount,
            },
          });
        } else {
          const invoiceCount = await tx.invoice.count({ where: { companyId: user.companyId } });
          await tx.invoice.create({
            data: {
              invoiceNumber: `INV-${String(invoiceCount + 1).padStart(6, "0")}`,
              status: "GENERATED",
              subtotal: data.grandTotal,
              grandTotal: data.grandTotal,
              paidAmount: data.paidAmount,
              pendingAmount: data.pendingAmount,
              tripId: id,
              companyId: user.companyId,
            },
          });
        }
      }
      return trip;
    });

    await createAuditLog({
      action: "UPDATE",
      entity: "Trip",
      entityId: updated.id,
      details: `Updated ${updated.tripNumber}`,
      userId: user.id,
      companyId: user.companyId,
    });
    revalidatePath("/trips");
    revalidatePath(`/trips/${id}`);
    return { success: true, data: { id: updated.id, tripNumber: updated.tripNumber } };
  } catch (error) {
    return errorResult(error);
  }
}

export async function deleteTrip(id: string): Promise<ActionResult<{ id: string }>> {
  const user = await requireCompany();
  try {
    const trip = await prisma.trip.findFirst({
      where: { id, companyId: user.companyId },
      select: { id: true, tripNumber: true },
    });
    if (!trip) return { success: false, error: "Trip not found." };

    await prisma.$transaction(async (tx) => {
      await tx.payment.deleteMany({ where: { tripId: id, companyId: user.companyId } });
      await tx.expense.deleteMany({ where: { tripId: id, companyId: user.companyId } });
      await tx.invoice.deleteMany({ where: { tripId: id, companyId: user.companyId } });
      await tx.trip.delete({ where: { id } });
    });
    await createAuditLog({
      action: "DELETE",
      entity: "Trip",
      entityId: id,
      details: `Deleted ${trip.tripNumber}`,
      userId: user.id,
      companyId: user.companyId,
    });
    revalidatePath("/trips");
    return { success: true, data: { id } };
  } catch (error) {
    return errorResult(error);
  }
}

export async function duplicateTrip(id: string): Promise<ActionResult<{ id: string; tripNumber: string }>> {
  const user = await requireCompany();
  try {
    const source = await prisma.trip.findFirst({ where: { id, companyId: user.companyId } });
    if (!source) return { success: false, error: "Trip not found." };

    const tripCount = await prisma.trip.count({ where: { companyId: user.companyId } });
    const tripNumber = `TRP-${String(tripCount + 1).padStart(6, "0")}`;
    const duplicate = await prisma.trip.create({
      data: {
        tripNumber,
        tripDate: new Date(),
        tripTime: source.tripTime,
        source: source.source,
        destination: source.destination,
        loadingKm: source.loadingKm,
        unloadingKm: source.unloadingKm,
        distance: source.distance,
        isLoaded: source.isLoaded,
        isEmpty: source.isEmpty,
        remarks: source.remarks,
        dieselRate: source.dieselRate,
        mileage: source.mileage,
        fuelFilled: source.fuelFilled,
        fuelRequired: source.fuelRequired,
        fuelCost: source.fuelCost,
        toll: source.toll,
        parking: source.parking,
        food: source.food,
        repair: source.repair,
        policeFine: source.policeFine,
        advance: source.advance,
        miscExpense: source.miscExpense,
        expenseTotal: source.expenseTotal,
        grandTotal: source.grandTotal,
        paidAmount: 0,
        pendingAmount: source.grandTotal,
        paymentMethod: source.paymentMethod,
        voucherNumber: source.voucherNumber,
        narration: source.narration,
        status: "DRAFT",
        vehicleId: source.vehicleId,
        driverId: source.driverId,
        driverPhone: source.driverPhone,
        companyId: user.companyId,
        createdById: user.id,
      },
    });

    await createAuditLog({
      action: "DUPLICATE",
      entity: "Trip",
      entityId: duplicate.id,
      details: `Duplicated ${source.tripNumber} as ${duplicate.tripNumber}`,
      userId: user.id,
      companyId: user.companyId,
    });
    revalidatePath("/trips");
    return { success: true, data: { id: duplicate.id, tripNumber: duplicate.tripNumber } };
  } catch (error) {
    return errorResult(error);
  }
}

export async function getTrips(
  options: GetTripsOptions = {}
): Promise<ActionResult<PaginatedResult<TripListItem>>> {
  const user = await requireCompany();
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 10));
  const search = options.search?.trim();
  const where: Prisma.TripWhereInput = {
    companyId: user.companyId,
    ...(options.status ? { status: options.status } : {}),
    ...(search
      ? {
          OR: [
            { tripNumber: { contains: search, mode: "insensitive" } },
            { source: { contains: search, mode: "insensitive" } },
            { destination: { contains: search, mode: "insensitive" } },
            { vehicle: { number: { contains: search, mode: "insensitive" } } },
            { driver: { is: { name: { contains: search, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };

  try {
    const [items, total] = await prisma.$transaction([
      prisma.trip.findMany({
        where,
        select: tripListSelect,
        orderBy: [{ tripDate: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.trip.count({ where }),
    ]);
    return {
      success: true,
      data: {
        data: items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error) {
    return errorResult(error);
  }
}

const tripListSelect = {
  id: true,
  tripNumber: true,
  tripDate: true,
  source: true,
  destination: true,
  distance: true,
  grandTotal: true,
  pendingAmount: true,
  status: true,
  vehicle: { select: { id: true, number: true, type: true } },
  driver: { select: { id: true, name: true, phone: true } },
} satisfies Prisma.TripSelect;

type TripListItem = Prisma.TripGetPayload<{ select: typeof tripListSelect }>;
type TripDetail = Prisma.TripGetPayload<{
  include: { vehicle: true; driver: true; invoice: true };
}>;

export async function getTripById(id: string): Promise<ActionResult<TripDetail>> {
  const user = await requireCompany();
  try {
    const trip = await prisma.trip.findFirst({
      where: { id, companyId: user.companyId },
      include: { vehicle: true, driver: true, invoice: true },
    });
    if (!trip) return { success: false, error: "Trip not found." };
    return { success: true, data: trip };
  } catch (error) {
    return errorResult(error);
  }
}
