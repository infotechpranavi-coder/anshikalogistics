import { FileText } from "lucide-react";
import { getInvoices } from "@/actions/invoices";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { InvoicesPageTable } from "@/features/invoices/invoices-page-table";

export default async function InvoicesPage() {
  const invoices = (await getInvoices()).data ?? [];

  return (
    <div className="page-stack">
      <PageHeader badge="Billing" title="Invoices" description="Review generated invoices and outstanding balances." />
      {invoices.length ? (
        <InvoicesPageTable data={invoices} />
      ) : (
        <EmptyState
          icon={FileText}
          title="No invoices"
          description="Complete a trip or generate an invoice to see it here."
        />
      )}
    </div>
  );
}
