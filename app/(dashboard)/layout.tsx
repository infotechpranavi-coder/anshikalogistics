import type { ReactNode } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireAuth } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const user = await requireAuth();

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
