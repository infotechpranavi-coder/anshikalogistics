import { PageHeader } from "@/components/shared/page-header";
import { ReportsView } from "@/features/reports/reports-view";

export default function ReportsPage() {
  return (
    <div className="page-stack">
      <PageHeader
        badge="Analytics"
        title="Reports"
        description="Analyze fleet activity, expenses, fuel, and payments."
      />
      <ReportsView />
    </div>
  );
}
