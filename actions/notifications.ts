"use server";

import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/session";
import type { ActionResult, NotificationType } from "@/types";

export async function getNotifications(options: { unreadOnly?: boolean; limit?: number } = {}) {
  const user = await requireCompany();
  try {
    const data = await prisma.notification.findMany({ where: { userId: user.id, companyId: user.companyId, ...(options.unreadOnly ? { isRead: false } : {}) }, orderBy: { createdAt: "desc" }, take: Math.min(100, options.limit ?? 50) });
    return { success: true, data } satisfies ActionResult<typeof data>;
  } catch (error) {
    console.error("Get notifications failed:", error);
    return { success: false, error: "Unable to load notifications." };
  }
}

export async function markAsRead(id: string): Promise<ActionResult<{ id: string }>> {
  const user = await requireCompany();
  const notification = await prisma.notification.findFirst({ where: { id, userId: user.id, companyId: user.companyId }, select: { id: true } });
  if (!notification) return { success: false, error: "Notification not found." };
  await prisma.notification.update({ where: { id }, data: { isRead: true } });
  revalidatePath("/notifications");
  return { success: true, data: { id } };
}

export async function markAllRead(): Promise<ActionResult<{ count: number }>> {
  const user = await requireCompany();
  const result = await prisma.notification.updateMany({ where: { userId: user.id, companyId: user.companyId, isRead: false }, data: { isRead: true } });
  revalidatePath("/notifications");
  return { success: true, data: { count: result.count } };
}

export async function checkExpiryAlerts(): Promise<ActionResult<{ created: number }>> {
  const user = await requireCompany();
  const now = new Date();
  const threshold = new Date(now.getTime() + 30 * 86_400_000);
  try {
    const [vehicles, drivers] = await Promise.all([
      prisma.vehicle.findMany({ where: { companyId: user.companyId, OR: [{ insuranceExpiry: { lte: threshold } }, { permitExpiry: { lte: threshold } }, { fitnessExpiry: { lte: threshold } }, { pollutionExpiry: { lte: threshold } }] }, select: { id: true, number: true, insuranceExpiry: true, permitExpiry: true, fitnessExpiry: true, pollutionExpiry: true } }),
      prisma.driver.findMany({ where: { companyId: user.companyId, licenseExpiry: { lte: threshold } }, select: { id: true, name: true, licenseExpiry: true } }),
    ]);
    const alerts: Array<{ key: string; title: string; message: string; type: NotificationType; link: string }> = [];
    const add = (key: string, label: string, date: Date | null, type: NotificationType, link: string) => {
      if (date) alerts.push({ key: `${key}:${date.toISOString().slice(0, 10)}`, title: `${label} ${date < now ? "expired" : "expiring soon"}`, message: `${label} ${date < now ? "expired" : "expires"} on ${date.toLocaleDateString("en-IN")}.`, type, link });
    };
    vehicles.forEach((v) => {
      add(`insurance:${v.id}`, `${v.number} insurance`, v.insuranceExpiry, "INSURANCE_EXPIRY", `/vehicles/${v.id}`);
      add(`permit:${v.id}`, `${v.number} permit`, v.permitExpiry, "PERMIT_EXPIRY", `/vehicles/${v.id}`);
      add(`fitness:${v.id}`, `${v.number} fitness certificate`, v.fitnessExpiry, "FITNESS_EXPIRY", `/vehicles/${v.id}`);
      add(`pollution:${v.id}`, `${v.number} pollution certificate`, v.pollutionExpiry, "POLLUTION_EXPIRY", `/vehicles/${v.id}`);
    });
    drivers.forEach((d) => add(`license:${d.id}`, `${d.name} license`, d.licenseExpiry, "LICENSE_EXPIRY", `/drivers/${d.id}`));
    let created = 0;
    for (const alert of alerts) {
      const duplicate = await prisma.notification.findFirst({ where: { userId: user.id, companyId: user.companyId, message: { contains: alert.message } }, select: { id: true } });
      if (!duplicate) {
        await createNotification({ ...alert, userId: user.id, companyId: user.companyId });
        created++;
      }
    }
    revalidatePath("/notifications");
    return { success: true, data: { created } };
  } catch (error) {
    console.error("Expiry check failed:", error);
    return { success: false, error: "Unable to check expiry alerts." };
  }
}
