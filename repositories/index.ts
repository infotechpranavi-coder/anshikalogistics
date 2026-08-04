import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const tripRepository = {
  findMany(companyId: string, where?: Prisma.TripWhereInput) {
    return prisma.trip.findMany({
      where: { companyId, ...where },
      include: {
        vehicle: true,
        driver: true,
        invoice: true,
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { tripDate: "desc" },
    });
  },

  findById(id: string, companyId: string) {
    return prisma.trip.findFirst({
      where: { id, companyId },
      include: {
        vehicle: true,
        driver: true,
        invoice: true,
        expenses: true,
        payments: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  },

  count(companyId: string, where?: Prisma.TripWhereInput) {
    return prisma.trip.count({ where: { companyId, ...where } });
  },
};

export const vehicleRepository = {
  findMany(companyId: string, where?: Prisma.VehicleWhereInput) {
    return prisma.vehicle.findMany({
      where: { companyId, ...where },
      include: { currentDriver: true },
      orderBy: { number: "asc" },
    });
  },

  findById(id: string, companyId: string) {
    return prisma.vehicle.findFirst({
      where: { id, companyId },
      include: { currentDriver: true, trips: { take: 10, orderBy: { tripDate: "desc" } } },
    });
  },
};

export const driverRepository = {
  findMany(companyId: string, where?: Prisma.DriverWhereInput) {
    return prisma.driver.findMany({
      where: { companyId, ...where },
      include: { currentVehicles: true },
      orderBy: { name: "asc" },
    });
  },

  findById(id: string, companyId: string) {
    return prisma.driver.findFirst({
      where: { id, companyId },
      include: {
        currentVehicles: true,
        trips: { take: 10, orderBy: { tripDate: "desc" } },
        attendance: { take: 30, orderBy: { date: "desc" } },
      },
    });
  },
};

export const invoiceRepository = {
  findMany(companyId: string, where?: Prisma.InvoiceWhereInput) {
    return prisma.invoice.findMany({
      where: { companyId, ...where },
      include: { trip: { include: { vehicle: true, driver: true } } },
      orderBy: { invoiceDate: "desc" },
    });
  },

  findById(id: string, companyId: string) {
    return prisma.invoice.findFirst({
      where: { id, companyId },
      include: {
        trip: { include: { vehicle: true, driver: true } },
        payments: true,
        company: true,
      },
    });
  },
};

export const expenseRepository = {
  findMany(companyId: string, where?: Prisma.ExpenseWhereInput) {
    return prisma.expense.findMany({
      where: { companyId, ...where },
      include: {
        vehicle: true,
        driver: true,
        trip: true,
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
    });
  },
};
