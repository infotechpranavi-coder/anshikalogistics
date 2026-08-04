import type { ReactNode } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireAuth } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  await requireAuth();

  return <DashboardShell>{children}</DashboardShell>;
}
