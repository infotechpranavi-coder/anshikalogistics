import { prisma } from "@/lib/prisma";

export async function createAuditLog(params: {
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  userId?: string;
  companyId?: string;
  ipAddress?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        details: params.details,
        userId: params.userId,
        companyId: params.companyId,
        ipAddress: params.ipAddress,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}

export async function createNotification(params: {
  title: string;
  message: string;
  type?:
    | "INSURANCE_EXPIRY"
    | "PERMIT_EXPIRY"
    | "FITNESS_EXPIRY"
    | "POLLUTION_EXPIRY"
    | "LICENSE_EXPIRY"
    | "PENDING_PAYMENT"
    | "UPCOMING_TRIP"
    | "SYSTEM";
  userId: string;
  companyId?: string;
  link?: string;
}) {
  try {
    await prisma.notification.create({
      data: {
        title: params.title,
        message: params.message,
        type: params.type || "SYSTEM",
        userId: params.userId,
        companyId: params.companyId,
        link: params.link,
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}
