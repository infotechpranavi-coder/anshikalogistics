import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
  const hasAuthSecret = Boolean(
    process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  );
  const authUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || null;

  let dbConnected = false;
  let userCount: number | null = null;
  let dbError: string | null = null;

  if (hasDatabaseUrl) {
    try {
      userCount = await prisma.user.count();
      dbConnected = true;
    } catch (error) {
      dbError = error instanceof Error ? error.message : "Database connection failed";
    }
  } else {
    dbError = "DATABASE_URL is not set on this deployment";
  }

  return NextResponse.json({
    ok: hasDatabaseUrl && hasAuthSecret && dbConnected,
    hasDatabaseUrl,
    hasAuthSecret,
    authUrl,
    dbConnected,
    userCount,
    dbError,
  });
}
