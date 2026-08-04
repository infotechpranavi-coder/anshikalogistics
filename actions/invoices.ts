"use server";

import type { InvoiceStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/session";
import { generateInvoiceNumber } from "@/lib/utils";
import type { ActionResult } from "@/types";

const detailInclude = { trip: { include: { vehicle: true, driver: true } }, company: true, payments: { orderBy: { paymentDate: "desc" as const } } } as const;
const fail = (error: unknown): ActionResult<never> => {
  console.error("Invoice action failed:", error);
  return { success: false, error: "Unable to complete the invoice operation." };
};

async function nextNumber(companyId: string) {
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { invoicePrefix: true, invoiceStartingNumber: true } });
  if (!company) throw new Error("Company not found");
  const count = await prisma.invoice.count({ where: { companyId } });
  return generateInvoiceNumber(company.invoicePrefix, company.invoiceStartingNumber + count);
}

export async function getNextInvoiceNumber(): Promise<ActionResult<string>> {
  const user = await requireCompany();
  try { return { success: true, data: await nextNumber(user.companyId) }; } catch (error) { return fail(error); }
}

export async function getInvoices(filters: { status?: InvoiceStatus; from?: Date | string; to?: Date | string } = {}) {
  const user = await requireCompany();
  const where: Prisma.InvoiceWhereInput = {
    companyId: user.companyId,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.from || filters.to ? { invoiceDate: { ...(filters.from ? { gte: new Date(filters.from) } : {}), ...(filters.to ? { lte: new Date(filters.to) } : {}) } } : {}),
  };
  try {
    const data = await prisma.invoice.findMany({ where, include: { trip: { include: { vehicle: { select: { id: true, number: true } }, driver: { select: { id: true, name: true } } } } }, orderBy: { invoiceDate: "desc" } });
    return { success: true, data } satisfies ActionResult<typeof data>;
  } catch (error) { return fail(error); }
}

export async function getInvoiceById(id: string) {
  const user = await requireCompany();
  try {
    const data = await prisma.invoice.findFirst({ where: { id, companyId: user.companyId }, include: detailInclude });
    return data ? { success: true, data } : { success: false, error: "Invoice not found." };
  } catch (error) { return fail(error); }
}

export async function generateInvoiceFromTrip(tripId: string) {
  const user = await requireCompany();
  try {
    const trip = await prisma.trip.findFirst({ where: { id: tripId, companyId: user.companyId }, include: { invoice: true } });
    if (!trip) return { success: false, error: "Trip not found." };
    if (trip.invoice) return { success: true, data: { id: trip.invoice.id, invoiceNumber: trip.invoice.invoiceNumber } };
    const invoiceNumber = await nextNumber(user.companyId);
    const invoice = await prisma.invoice.create({ data: { invoiceNumber, status: "GENERATED", subtotal: trip.grandTotal, grandTotal: trip.grandTotal, paidAmount: trip.paidAmount, pendingAmount: trip.pendingAmount, tripId, companyId: user.companyId } });
    await createAuditLog({ action: "CREATE", entity: "Invoice", entityId: invoice.id, details: `Generated ${invoiceNumber} from ${trip.tripNumber}`, userId: user.id, companyId: user.companyId });
    revalidatePath("/invoices"); revalidatePath(`/trips/${tripId}`);
    return { success: true, data: { id: invoice.id, invoiceNumber } };
  } catch (error) { return fail(error); }
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<ActionResult<{ id: string }>> {
  const user = await requireCompany();
  if (!["DRAFT", "GENERATED", "SENT", "PAID", "CANCELLED"].includes(status)) return { success: false, error: "Invalid invoice status." };
  try {
    const existing = await prisma.invoice.findFirst({ where: { id, companyId: user.companyId }, select: { id: true, invoiceNumber: true } });
    if (!existing) return { success: false, error: "Invoice not found." };
    await prisma.invoice.update({ where: { id }, data: { status, ...(status === "PAID" ? { pendingAmount: 0 } : {}) } });
    await createAuditLog({ action: "STATUS_CHANGE", entity: "Invoice", entityId: id, details: `${existing.invoiceNumber} changed to ${status}`, userId: user.id, companyId: user.companyId });
    revalidatePath("/invoices"); revalidatePath(`/invoices/${id}`);
    return { success: true, data: { id } };
  } catch (error) { return fail(error); }
}
