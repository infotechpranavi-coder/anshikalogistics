"use server";

import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/session";
import type { ActionResult } from "@/types";

export interface DateRange { from: Date | string; to: Date | string }
const dates = (range: DateRange) => ({ gte: new Date(range.from), lte: new Date(range.to) });
const fail = (error: unknown): ActionResult<never> => {
  console.error("Report failed:", error);
  return { success: false, error: "Unable to generate the report." };
};

export async function getDailyReport(range: DateRange) {
  const user = await requireCompany();
  try {
    const trips = await prisma.trip.findMany({ where: { companyId: user.companyId, tripDate: dates(range) }, select: { tripDate: true, distance: true, fuelFilled: true, fuelCost: true, expenseTotal: true, grandTotal: true, paidAmount: true, pendingAmount: true } });
    const grouped = new Map<string, { date: string; trips: number; distance: number; fuel: number; fuelCost: number; expenses: number; revenue: number; paid: number; pending: number }>();
    trips.forEach((t) => {
      const key = t.tripDate.toISOString().slice(0, 10);
      const row = grouped.get(key) ?? { date: key, trips: 0, distance: 0, fuel: 0, fuelCost: 0, expenses: 0, revenue: 0, paid: 0, pending: 0 };
      row.trips++; row.distance += t.distance; row.fuel += t.fuelFilled; row.fuelCost += t.fuelCost; row.expenses += t.expenseTotal; row.revenue += t.grandTotal; row.paid += t.paidAmount; row.pending += t.pendingAmount;
      grouped.set(key, row);
    });
    return { success: true, data: [...grouped.values()].sort((a, b) => a.date.localeCompare(b.date)) };
  } catch (error) { return fail(error); }
}

export async function getMonthlyReport(range: DateRange) {
  const daily = await getDailyReport(range);
  if (!daily.success || !daily.data) return daily;
  const grouped = new Map<string, { month: string; trips: number; distance: number; fuelCost: number; expenses: number; revenue: number; paid: number; pending: number }>();
  daily.data.forEach((d) => {
    const key = d.date.slice(0, 7);
    const row = grouped.get(key) ?? { month: key, trips: 0, distance: 0, fuelCost: 0, expenses: 0, revenue: 0, paid: 0, pending: 0 };
    row.trips += d.trips; row.distance += d.distance; row.fuelCost += d.fuelCost; row.expenses += d.expenses; row.revenue += d.revenue; row.paid += d.paid; row.pending += d.pending;
    grouped.set(key, row);
  });
  return { success: true, data: [...grouped.values()] };
}

export async function getVehicleReport(range: DateRange) {
  const user = await requireCompany();
  try {
    const data = await prisma.vehicle.findMany({ where: { companyId: user.companyId }, select: { id: true, number: true, type: true, status: true, trips: { where: { tripDate: dates(range) }, select: { distance: true, fuelFilled: true, fuelCost: true, grandTotal: true, expenseTotal: true } }, expenses: { where: { date: dates(range) }, select: { amount: true } } } });
    return { success: true, data: data.map((v) => ({ id: v.id, vehicle: v.number, type: v.type, status: v.status, trips: v.trips.length, distance: v.trips.reduce((s, x) => s + x.distance, 0), fuel: v.trips.reduce((s, x) => s + x.fuelFilled, 0), fuelCost: v.trips.reduce((s, x) => s + x.fuelCost, 0), revenue: v.trips.reduce((s, x) => s + x.grandTotal, 0), expenses: v.trips.reduce((s, x) => s + x.expenseTotal, 0) + v.expenses.reduce((s, x) => s + x.amount, 0) })) };
  } catch (error) { return fail(error); }
}

export async function getDriverReport(range: DateRange) {
  const user = await requireCompany();
  try {
    const data = await prisma.driver.findMany({ where: { companyId: user.companyId }, select: { id: true, name: true, phone: true, isActive: true, trips: { where: { tripDate: dates(range) }, select: { distance: true, grandTotal: true, pendingAmount: true } }, expenses: { where: { date: dates(range) }, select: { amount: true } } } });
    return { success: true, data: data.map((d) => ({ id: d.id, driver: d.name, phone: d.phone, active: d.isActive, trips: d.trips.length, distance: d.trips.reduce((s, x) => s + x.distance, 0), revenue: d.trips.reduce((s, x) => s + x.grandTotal, 0), pending: d.trips.reduce((s, x) => s + x.pendingAmount, 0), expenses: d.expenses.reduce((s, x) => s + x.amount, 0) })) };
  } catch (error) { return fail(error); }
}

export async function getExpenseReport(range: DateRange) {
  const user = await requireCompany();
  try {
    const rows = await prisma.expense.groupBy({ by: ["category", "type"], where: { companyId: user.companyId, date: dates(range) }, _count: { _all: true }, _sum: { amount: true } });
    return { success: true, data: rows.map((r) => ({ category: r.category, type: r.type, count: r._count._all, amount: r._sum.amount ?? 0 })) };
  } catch (error) { return fail(error); }
}

export async function getFuelReport(range: DateRange) {
  const user = await requireCompany();
  try {
    const rows = await prisma.trip.findMany({ where: { companyId: user.companyId, tripDate: dates(range) }, select: { tripNumber: true, tripDate: true, distance: true, fuelFilled: true, fuelRequired: true, fuelCost: true, mileage: true, vehicle: { select: { number: true } } }, orderBy: { tripDate: "desc" } });
    return { success: true, data: rows.map((r) => ({ trip: r.tripNumber, date: r.tripDate.toISOString(), vehicle: r.vehicle.number, distance: r.distance, fuelFilled: r.fuelFilled, fuelRequired: r.fuelRequired, fuelCost: r.fuelCost, mileage: r.mileage })) };
  } catch (error) { return fail(error); }
}

export async function getPaymentReport(range: DateRange) {
  const user = await requireCompany();
  try {
    const rows = await prisma.payment.findMany({ where: { companyId: user.companyId, paymentDate: dates(range) }, include: { invoice: { select: { invoiceNumber: true } }, trip: { select: { tripNumber: true } } }, orderBy: { paymentDate: "desc" } });
    return { success: true, data: rows.map((r) => ({ id: r.id, date: r.paymentDate.toISOString(), invoice: r.invoice?.invoiceNumber ?? "", trip: r.trip?.tripNumber ?? "", method: r.method, status: r.status, amount: r.amount, reference: r.reference ?? "" })) };
  } catch (error) { return fail(error); }
}
