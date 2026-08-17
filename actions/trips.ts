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
  vehicleId?: string;
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
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2028") {
    return { success: false, error: "Delete took too long. Please try again with fewer trips selected." };
  }
  return { success: false, error: "Unable to complete the trip operation." };
}

const BULK_DELETE_BATCH_SIZE = 100;
const DELETE_TRANSACTION_OPTIONS = { maxWait: 10_000, timeout: 60_000 };

async function deleteTripRecords(
  tx: Prisma.TransactionClient,
  tripIds: string[],
  companyId: string
) {
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

function computedTripData(data: TripInput) {
  const extraExpenses = (data.extraExpenses ?? []).filter(
    (item) => item.title.trim() && item.amount > 0
  );
  const extraTotal = extraExpenses.reduce((sum, item) => sum + item.amount, 0);
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
    miscExpense: extraTotal || data.miscExpense,
    paidAmount: data.paidAmount,
  });
  const distance = data.distance && data.distance > 0 ? data.distance : totals.distance;
  const fuelRequired = data.fuelRequired ?? totals.fuelRequired;
  const fuelCost = data.fuelCost ?? totals.fuelCost;
  const expenseTotal = extraTotal || totals.expenseTotal;
  const grandTotal = data.grandTotal ?? fuelCost + expenseTotal;
  const { extraExpenses: _ignored, ...tripFields } = data;
  return {
    ...tripFields,
    extraExpenses,
    distance,
    fuelRequired,
    fuelCost,
    miscExpense: extraTotal,
    expenseTotal,
    grandTotal,
    pendingAmount: Math.max(0, grandTotal - (data.paidAmount || 0)),
  };
}

async function saveTripExpenses(
  tx: Prisma.TransactionClient,
  input: {
    extraExpenses: { title: string; amount: number }[];
    tripId: string;
    vehicleId: string;
    driverId?: string | null;
    tripDate: Date;
    companyId: string;
    createdById: string;
  }
) {
  await tx.expense.deleteMany({ where: { tripId: input.tripId, companyId: input.companyId } });
  for (const item of input.extraExpenses) {
    await tx.expense.create({
      data: {
        title: item.title.trim(),
        amount: item.amount,
        type: "TRIP",
        category: "OTHER",
        date: input.tripDate,
        tripId: input.tripId,
        vehicleId: input.vehicleId,
        driverId: input.driverId ?? null,
        companyId: input.companyId,
        createdById: input.createdById,
      },
    });
  }
}

export async function createTrip(input: TripInput): Promise<ActionResult<{ id: string; tripNumber: string }>> {
  const user = await requireCompany();
  const parsed = tripSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed);

  try {
    const { extraExpenses, ...tripData } = computedTripData(parsed.data);
    const created = await prisma.$transaction(async (tx) => {
      const tripCount = await tx.trip.count({ where: { companyId: user.companyId } });
      const tripNumber = `TRP-${String(tripCount + 1).padStart(6, "0")}`;
      const trip = await tx.trip.create({
        data: {
          ...tripData,
          tripNumber,
          companyId: user.companyId,
          createdById: user.id,
        },
      });
      await saveTripExpenses(tx, {
        extraExpenses,
        tripId: trip.id,
        vehicleId: tripData.vehicleId,
        driverId: tripData.driverId,
        tripDate: tripData.tripDate,
        companyId: user.companyId,
        createdById: user.id,
      });

      if (tripData.status === "COMPLETED") {
        const invoiceCount = await tx.invoice.count({ where: { companyId: user.companyId } });
        await tx.invoice.create({
          data: {
            invoiceNumber: `INV-${String(invoiceCount + 1).padStart(6, "0")}`,
            status: "GENERATED",
            subtotal: tripData.grandTotal,
            grandTotal: tripData.grandTotal,
            paidAmount: tripData.paidAmount,
            pendingAmount: tripData.pendingAmount,
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

    const { extraExpenses, ...tripData } = computedTripData(parsed.data);
    const updated = await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.update({ where: { id }, data: tripData });
      await saveTripExpenses(tx, {
        extraExpenses,
        tripId: id,
        vehicleId: tripData.vehicleId,
        driverId: tripData.driverId,
        tripDate: tripData.tripDate,
        companyId: user.companyId,
        createdById: user.id,
      });
      if (tripData.status === "COMPLETED") {
        const invoice = await tx.invoice.findUnique({ where: { tripId: id }, select: { id: true } });
        if (invoice) {
          await tx.invoice.update({
            where: { id: invoice.id },
            data: {
              status: "GENERATED",
              subtotal: tripData.grandTotal,
              grandTotal: tripData.grandTotal,
              paidAmount: tripData.paidAmount,
              pendingAmount: tripData.pendingAmount,
            },
          });
        } else {
          const invoiceCount = await tx.invoice.count({ where: { companyId: user.companyId } });
          await tx.invoice.create({
            data: {
              invoiceNumber: `INV-${String(invoiceCount + 1).padStart(6, "0")}`,
              status: "GENERATED",
              subtotal: tripData.grandTotal,
              grandTotal: tripData.grandTotal,
              paidAmount: tripData.paidAmount,
              pendingAmount: tripData.pendingAmount,
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

    await prisma.$transaction(
      (tx) => deleteTripRecords(tx, [id], user.companyId),
      DELETE_TRANSACTION_OPTIONS
    );
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

export async function deleteTrips(ids: string[]): Promise<ActionResult<{ count: number }>> {
  const user = await requireCompany();
  const uniqueIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  if (!uniqueIds.length) return { success: false, error: "Select at least one trip." };

  try {
    const trips = await prisma.trip.findMany({
      where: { id: { in: uniqueIds }, companyId: user.companyId },
      select: { id: true, tripNumber: true },
    });
    if (!trips.length) return { success: false, error: "No matching trips found." };

    const tripIds = trips.map((trip) => trip.id);
    for (let index = 0; index < tripIds.length; index += BULK_DELETE_BATCH_SIZE) {
      const batch = tripIds.slice(index, index + BULK_DELETE_BATCH_SIZE);
      await prisma.$transaction(
        (tx) => deleteTripRecords(tx, batch, user.companyId),
        DELETE_TRANSACTION_OPTIONS
      );
    }

    const preview = trips
      .slice(0, 20)
      .map((trip) => trip.tripNumber)
      .join(", ");
    await createAuditLog({
      action: "DELETE",
      entity: "Trip",
      entityId: tripIds[0],
      details: `Bulk deleted ${trips.length} trips${preview ? `: ${preview}` : ""}${trips.length > 20 ? "…" : ""}`,
      userId: user.id,
      companyId: user.companyId,
    });
    revalidatePath("/trips");
    return { success: true, data: { count: trips.length } };
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
  const pageSize = Math.min(5000, Math.max(1, options.pageSize ?? 10));
  const search = options.search?.trim();
  const where: Prisma.TripWhereInput = {
    companyId: user.companyId,
    ...(options.vehicleId ? { vehicleId: options.vehicleId } : {}),
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
  loadingKm: true,
  unloadingKm: true,
  distance: true,
  isLoaded: true,
  isEmpty: true,
  fuelRequired: true,
  fuelFilled: true,
  fuelCost: true,
  remarks: true,
  voucherNumber: true,
  grandTotal: true,
  narration: true,
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

export interface ImportTripsResult {
  imported: number;
  skipped: number;
  vehiclesCreated: number;
  driversCreated: number;
  sheets: string[];
  errors: string[];
}

export async function importTripsFromExcel(
  formData: FormData
): Promise<ActionResult<ImportTripsResult>> {
  const user = await requireCompany();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Please choose an Excel file to import." };
  }
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return { success: false, error: "Only .xlsx files are supported." };
  }

  try {
    const { parseDieselExpenseWorkbook } = await import("@/lib/excel-import");
    const parsed = await parseDieselExpenseWorkbook(await file.arrayBuffer());
    if (!parsed.trips.length) {
      return {
        success: false,
        error: parsed.errors[0] ?? "No trip rows found in the Excel file.",
        data: {
          imported: 0,
          skipped: parsed.skipped,
          vehiclesCreated: 0,
          driversCreated: 0,
          sheets: parsed.sheets,
          errors: parsed.errors,
        },
      };
    }

    const vehicles = await prisma.vehicle.findMany({
      where: { companyId: user.companyId },
      select: { id: true, number: true },
    });
    const drivers = await prisma.driver.findMany({
      where: { companyId: user.companyId },
      select: { id: true, name: true },
    });
    const vehicleByNumber = new Map(
      vehicles.map((vehicle) => [vehicle.number.replace(/\s+/g, "").toLowerCase(), vehicle.id])
    );
    const driverByName = new Map(
      drivers.map((driver) => [driver.name.trim().toLowerCase(), driver.id])
    );

    let vehiclesCreated = 0;
    let driversCreated = 0;

    for (const number of [...new Set(parsed.trips.map((trip) => trip.vehicleNumber))]) {
      const key = number.replace(/\s+/g, "").toLowerCase();
      if (vehicleByNumber.has(key)) continue;
      const created = await prisma.vehicle.create({
        data: {
          number,
          type: "Truck",
          fuelType: "DIESEL",
          status: "ACTIVE",
          companyId: user.companyId,
        },
        select: { id: true, number: true },
      });
      vehicleByNumber.set(key, created.id);
      vehiclesCreated += 1;
    }

    for (const name of [...new Set(parsed.trips.map((trip) => trip.driverName).filter(Boolean))] as string[]) {
      const key = name.trim().toLowerCase();
      if (driverByName.has(key)) continue;
      const created = await prisma.driver.create({
        data: {
          name: name.trim(),
          phone: "0000000000",
          isActive: true,
          companyId: user.companyId,
        },
        select: { id: true, name: true },
      });
      driverByName.set(key, created.id);
      driversCreated += 1;
    }

    const existing = await prisma.trip.findMany({
      where: { companyId: user.companyId },
      select: {
        vehicle: { select: { number: true } },
        tripDate: true,
        source: true,
        destination: true,
        loadingKm: true,
      },
    });
    const existingKeys = new Set(
      existing.map(
        (trip) =>
          `${trip.vehicle.number}|${trip.tripDate.toISOString().slice(0, 10)}|${trip.source.toLowerCase()}|${trip.destination.toLowerCase()}|${trip.loadingKm}`
      )
    );

    let tripCount = await prisma.trip.count({ where: { companyId: user.companyId } });
    let imported = 0;
    let skipped = parsed.skipped;
    const errors = [...parsed.errors];

    for (const row of parsed.trips) {
      const year = row.tripDate.getUTCFullYear();
      if (year < 2000 || year > 2099) {
        skipped += 1;
        continue;
      }

      const tripDate = new Date(
        Date.UTC(year, row.tripDate.getUTCMonth(), row.tripDate.getUTCDate())
      );
      const duplicateKey = `${row.vehicleNumber}|${tripDate.toISOString().slice(0, 10)}|${row.source.toLowerCase()}|${row.destination.toLowerCase()}|${row.loadingKm}`;
      if (existingKeys.has(duplicateKey)) {
        skipped += 1;
        continue;
      }

      const vehicleId = vehicleByNumber.get(row.vehicleNumber.replace(/\s+/g, "").toLowerCase());
      if (!vehicleId) {
        errors.push(`Row ${row.rowNumber} (${row.sheetName}): vehicle ${row.vehicleNumber} could not be created.`);
        continue;
      }

      const driverId = row.driverName
        ? driverByName.get(row.driverName.trim().toLowerCase()) ?? null
        : null;
      tripCount += 1;
      const tripNumber = `TRP-${String(tripCount).padStart(6, "0")}`;
      const expenseTotal = row.voucherAmount;
      const fuelCost = row.fuelCost;
      const grandTotal = row.grandTotal || fuelCost + expenseTotal;
      const paidAmount = row.paidAmount;
      const pendingAmount = Math.max(0, row.pendingAmount || grandTotal - paidAmount);

      try {
        await prisma.trip.create({
          data: {
            tripNumber,
            tripDate,
            source: row.source,
            destination: row.destination,
            loadingKm: row.loadingKm,
            unloadingKm: row.unloadingKm,
            distance: row.distance,
            isLoaded: row.isLoaded,
            isEmpty: row.isEmpty,
            remarks: row.entry || (row.driverName ? `Driver: ${row.driverName}` : null),
            dieselRate: 0,
            mileage: row.fuelRequired > 0 ? row.distance / row.fuelRequired : 0,
            fuelFilled: row.fuelFilled,
            fuelRequired: row.fuelRequired,
            fuelCost,
            miscExpense: expenseTotal,
            expenseTotal,
            grandTotal,
            paidAmount,
            pendingAmount,
            paymentMethod: paidAmount > 0 ? "CASH" : null,
            voucherNumber: row.voucherNumber || null,
            narration: row.narration || null,
            status: "COMPLETED",
            vehicleId,
            driverId,
            companyId: user.companyId,
            createdById: user.id,
          },
        });
        existingKeys.add(duplicateKey);
        imported += 1;
      } catch (error) {
        errors.push(
          `Row ${row.rowNumber} (${row.sheetName}): ${error instanceof Error ? error.message : "Unable to import trip."}`
        );
      }
    }

    await createAuditLog({
      action: "IMPORT",
      entity: "Trip",
      details: `Imported ${imported} trips from Excel (${vehiclesCreated} vehicles, ${driversCreated} drivers created)`,
      userId: user.id,
      companyId: user.companyId,
    });
    revalidatePath("/trips");
    revalidatePath("/vehicles");
    revalidatePath("/drivers");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: {
        imported,
        skipped,
        vehiclesCreated,
        driversCreated,
        sheets: parsed.sheets,
        errors: errors.slice(0, 25),
      },
    };
  } catch (error) {
    return errorResult(error);
  }
}
