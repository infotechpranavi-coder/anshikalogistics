import { getDashboardStats } from "@/actions/dashboard";
import { DashboardView } from "@/features/dashboard/dashboard-view";
import { requireCompany } from "@/lib/session";

export default async function DashboardPage() {
  const user = await requireCompany();
  const dashboard = await getDashboardStats(user.companyId);

  return <DashboardView {...dashboard} />;
}
