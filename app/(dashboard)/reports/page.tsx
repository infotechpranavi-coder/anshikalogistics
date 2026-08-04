import { PageHeader } from "@/components/shared/page-header";
import { ReportsView } from "@/features/reports/reports-view";
export default function ReportsPage(){return <div className="space-y-6"><PageHeader title="Reports" description="Analyze fleet activity, expenses, fuel, and payments."/><ReportsView/></div>}
