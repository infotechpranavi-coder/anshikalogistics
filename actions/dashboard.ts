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

  const [
    trips,
    expenses,
    vehicles,
    completedTrips,
    pendingInvoiceTotals,
    recentTrips,
    recentInvoices,
    recentExpenses,
  ] = await Promise.all([
    prisma.trip.findMany({
      where: { companyId, tripDate: { gte: rangeStart, lte: rangeEnd } },
      select: {
        tripDate: true,
        vehicleId: true,
        fuelFilled: true,
        fuelRequired: true,
        fuelCost: true,
        expenseTotal: true,
        grandTotal: true,
        distance: true,
        toll: true,
        parking: true,
        food: true,
        repair: true,
        policeFine: true,
        advance: true,
        miscExpense: true,
      },
    }),
    prisma.expense.findMany({
      where: { companyId, date: { gte: rangeStart, lte: rangeEnd } },
      select: { amount: true, category: true, date: true },
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
  ]);

  const monthBuckets = Array.from({ length: 6 }, (_, index) => {
    const date = subMonths(now, 5 - index);
    return {
      key: format(date, "yyyy-MM"),
      name: format(date, "MMM"),
      expenses: 0,
      fuel: 0,
      trips: 0,
    };
  });
  const monthsByKey = new Map(monthBuckets.map((month) => [month.key, month]));
  const usage = new Map<string, number>();
  const categories = new Map<string, number>();

  for (const trip of trips) {
    const month = monthsByKey.get(format(trip.tripDate, "yyyy-MM"));
    if (month) {
      month.expenses += trip.grandTotal;
      month.fuel += trip.fuelFilled || trip.fuelRequired;
      month.trips += 1;
    }
    usage.set(trip.vehicleId, (usage.get(trip.vehicleId) ?? 0) + 1);
    addCategory(categories, "FUEL", trip.fuelCost);
    addCategory(categories, "TOLL", trip.toll);
    addCategory(categories, "PARKING", trip.parking);
    addCategory(categories, "FOOD", trip.food);
    addCategory(categories, "REPAIR", trip.repair);
    addCategory(categories, "POLICE_FINE", trip.policeFine);
    addCategory(categories, "ADVANCE", trip.advance);
    addCategory(categories, "MISC", trip.miscExpense);
  }

  for (const expense of expenses) {
    const month = monthsByKey.get(format(expense.date, "yyyy-MM"));
    if (month) month.expenses += expense.amount;
    addCategory(categories, expense.category, expense.amount);
  }

  const todaysTrips = trips.filter(
    (trip) => trip.tripDate >= todayStart && trip.tripDate <= todayEnd
  );
  const todaysExpenses = expenses.filter(
    (expense) => expense.date >= todayStart && expense.date <= todayEnd
  );
  const currentMonth = monthsByKey.get(format(now, "yyyy-MM"));
  const totalDistance = trips.reduce((total, trip) => total + trip.distance, 0);
  const totalFuel = trips.reduce(
    (total, trip) => total + (trip.fuelFilled || trip.fuelRequired),
    0
  );
  const mileageVehicles = vehicles.filter((vehicle) => vehicle.mileage > 0);

  const stats: DashboardStats = {
    todaysTrips: todaysTrips.length,
    todaysExpense:
      todaysTrips.reduce((total, trip) => total + trip.expenseTotal, 0) +
      todaysExpenses.reduce((total, expense) => total + expense.amount, 0),
    todaysDieselCost: todaysTrips.reduce((total, trip) => total + trip.fuelCost, 0),
    monthlyExpense: currentMonth?.expenses ?? 0,
    runningVehicles: vehicles.filter((vehicle) => vehicle.status === "ACTIVE").length,
    completedTrips,
    pendingPayments: pendingInvoiceTotals._sum.pendingAmount ?? 0,
    averageMileage: mileageVehicles.length
      ? mileageVehicles.reduce((total, vehicle) => total + vehicle.mileage, 0) /
        mileageVehicles.length
      : 0,
    fuelConsumption: totalFuel,
    distanceTravelled: totalDistance,
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
