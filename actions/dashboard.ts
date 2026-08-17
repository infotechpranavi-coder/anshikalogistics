"use server";

import {
  endOfDay,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns";
import type { DashboardStats } from "@/types";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/session";

export interface DashboardChartPoint {
  name: string;
  value: number;
}

export interface DashboardRecentTrip {
  id: string;
  tripNumber: string;
  tripDate: Date;
  source: string;
  destination: string;
  grandTotal: number;
  status: string;
  vehicle: { number: string };
  driver: { name: string } | null;
}

export interface DashboardRecentInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: Date;
  grandTotal: number;
  pendingAmount: number;
  status: string;
  trip: { id: string; tripNumber: string };
}

export interface DashboardRecentExpense {
  id: string;
  title: string;
  amount: number;
  date: Date;
  category: string;
  vehicle: { number: string } | null;
}

export interface DashboardData {
  stats: DashboardStats;
  monthlyExpenses: DashboardChartPoint[];
  fuelConsumption: DashboardChartPoint[];
  vehicleUsage: DashboardChartPoint[];
  tripsPerMonth: DashboardChartPoint[];
  expenseBreakdown: DashboardChartPoint[];
  recentTrips: DashboardRecentTrip[];
  recentInvoices: DashboardRecentInvoice[];
  recentExpenses: DashboardRecentExpense[];
}

const categoryLabels: Record<string, string> = {
  TOLL: "Toll",
  PARKING: "Parking",
  FOOD: "Food",
  REPAIR: "Repair",
  POLICE_FINE: "Police fines",
  ADVANCE: "Advances",
  MISC: "Miscellaneous",
  FUEL: "Fuel",
  SALARY: "Salary",
  INSURANCE: "Insurance",
  MAINTENANCE: "Maintenance",
  OTHER: "Other",
};

export async function getDashboardStats(companyId: string): Promise<DashboardData> {
  const user = await requireCompany();
  if (companyId !== user.companyId) {
    throw new Error("You do not have access to this company.");
  }

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const rangeStart = startOfMonth(subMonths(now, 5));
  const rangeEnd = endOfMonth(now);

  const monthRanges = Array.from({ length: 6 }, (_, index) => {
    const date = subMonths(now, 5 - index);
    return {
      key: format(date, "yyyy-MM"),
      name: format(date, "MMM"),
      start: startOfMonth(date),
      end: endOfMonth(date),
    };
  });

  const [
    todayTrips,
    todayExpenses,
    rangeTripTotals,
    expenseGroups,
    vehicleUsageRows,
    vehicles,
    completedTrips,
    pendingInvoiceTotals,
    recentTrips,
    recentInvoices,
    recentExpenses,
    ...monthlyTripTotals
  ] = await Promise.all([
    prisma.trip.aggregate({
      where: { companyId, tripDate: { gte: todayStart, lte: todayEnd } },
      _count: true,
      _sum: { expenseTotal: true, fuelCost: true },
    }),
    prisma.expense.aggregate({
      where: { companyId, date: { gte: todayStart, lte: todayEnd } },
      _sum: { amount: true },
    }),
    prisma.trip.aggregate({
      where: { companyId, tripDate: { gte: rangeStart, lte: rangeEnd } },
      _sum: {
        distance: true,
        fuelFilled: true,
        fuelRequired: true,
        fuelCost: true,
        toll: true,
        parking: true,
        food: true,
        repair: true,
        policeFine: true,
        advance: true,
        miscExpense: true,
      },
    }),
    prisma.expense.groupBy({
      by: ["category"],
      where: { companyId, date: { gte: rangeStart, lte: rangeEnd } },
      _sum: { amount: true },
    }),
    prisma.trip.groupBy({
      by: ["vehicleId"],
      where: { companyId, tripDate: { gte: rangeStart, lte: rangeEnd } },
      _count: { vehicleId: true },
    }),
    prisma.vehicle.findMany({
      where: { companyId },
      select: { id: true, number: true, mileage: true, status: true },
    }),
    prisma.trip.count({ where: { companyId, status: "COMPLETED" } }),
    prisma.invoice.aggregate({
      where: { companyId, status: { not: "CANCELLED" } },
      _sum: { pendingAmount: true },
    }),
    prisma.trip.findMany({
      where: { companyId },
      orderBy: [{ tripDate: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: {
        id: true,
        tripNumber: true,
        tripDate: true,
        source: true,
        destination: true,
        grandTotal: true,
        status: true,
        vehicle: { select: { number: true } },
        driver: { select: { name: true } },
      },
    }),
    prisma.invoice.findMany({
      where: { companyId },
      orderBy: [{ invoiceDate: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: {
        id: true,
        invoiceNumber: true,
        invoiceDate: true,
        grandTotal: true,
        pendingAmount: true,
        status: true,
        trip: { select: { id: true, tripNumber: true } },
      },
    }),
    prisma.expense.findMany({
      where: { companyId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: {
        id: true,
        title: true,
        amount: true,
        date: true,
        category: true,
        vehicle: { select: { number: true } },
      },
    }),
    ...monthRanges.map((month) =>
      prisma.trip.aggregate({
        where: { companyId, tripDate: { gte: month.start, lte: month.end } },
        _count: true,
        _sum: { grandTotal: true, fuelFilled: true, fuelRequired: true, expenseTotal: true },
      })
    ),
  ]);

  const monthBuckets = monthRanges.map((month, index) => {
    const totals = monthlyTripTotals[index];
    return {
      name: month.name,
      expenses: totals?._sum.grandTotal ?? 0,
      fuel: (totals?._sum.fuelFilled ?? 0) || (totals?._sum.fuelRequired ?? 0),
      trips: totals?._count ?? 0,
    };
  });
  const usage = new Map(vehicleUsageRows.map((row) => [row.vehicleId, row._count.vehicleId]));
  const categories = new Map<string, number>();
  addCategory(categories, "FUEL", rangeTripTotals._sum.fuelCost ?? 0);
  addCategory(categories, "TOLL", rangeTripTotals._sum.toll ?? 0);
  addCategory(categories, "PARKING", rangeTripTotals._sum.parking ?? 0);
  addCategory(categories, "FOOD", rangeTripTotals._sum.food ?? 0);
  addCategory(categories, "REPAIR", rangeTripTotals._sum.repair ?? 0);
  addCategory(categories, "POLICE_FINE", rangeTripTotals._sum.policeFine ?? 0);
  addCategory(categories, "ADVANCE", rangeTripTotals._sum.advance ?? 0);
  addCategory(categories, "MISC", rangeTripTotals._sum.miscExpense ?? 0);
  for (const group of expenseGroups) {
    addCategory(categories, group.category, group._sum.amount ?? 0);
  }

  const mileageVehicles = vehicles.filter((vehicle) => vehicle.mileage > 0);
  const currentMonth = monthBuckets[monthBuckets.length - 1];
  const totalFuel =
    (rangeTripTotals._sum.fuelFilled ?? 0) || (rangeTripTotals._sum.fuelRequired ?? 0);

  const stats: DashboardStats = {
    todaysTrips: todayTrips._count,
    todaysExpense: (todayTrips._sum.expenseTotal ?? 0) + (todayExpenses._sum.amount ?? 0),
    todaysDieselCost: todayTrips._sum.fuelCost ?? 0,
    monthlyExpense: currentMonth?.expenses ?? 0,
    runningVehicles: vehicles.filter((vehicle) => vehicle.status === "ACTIVE").length,
    completedTrips,
    pendingPayments: pendingInvoiceTotals._sum.pendingAmount ?? 0,
    averageMileage: mileageVehicles.length
      ? mileageVehicles.reduce((total, vehicle) => total + vehicle.mileage, 0) /
        mileageVehicles.length
      : 0,
    fuelConsumption: totalFuel,
    distanceTravelled: rangeTripTotals._sum.distance ?? 0,
  };

  return {
    stats,
    monthlyExpenses: monthBuckets.map(({ name, expenses: value }) => ({ name, value })),
    fuelConsumption: monthBuckets.map(({ name, fuel: value }) => ({ name, value })),
    tripsPerMonth: monthBuckets.map(({ name, trips: value }) => ({ name, value })),
    vehicleUsage: vehicles
      .map((vehicle) => ({ name: vehicle.number, value: usage.get(vehicle.id) ?? 0 }))
      .filter((vehicle) => vehicle.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 7),
    expenseBreakdown: [...categories.entries()]
      .filter(([, value]) => value > 0)
      .map(([category, value]) => ({
        name: categoryLabels[category] ?? category.replaceAll("_", " "),
        value,
      }))
      .sort((a, b) => b.value - a.value),
    recentTrips: recentTrips.map((trip) => ({ ...trip, status: trip.status })),
    recentInvoices: recentInvoices.map((invoice) => ({
      ...invoice,
      status: invoice.status,
    })),
    recentExpenses: recentExpenses.map((expense) => ({
      ...expense,
      category: expense.category,
    })),
  };
}

function addCategory(categories: Map<string, number>, category: string, value: number) {
  if (value <= 0) return;
  categories.set(category, (categories.get(category) ?? 0) + value);
}
