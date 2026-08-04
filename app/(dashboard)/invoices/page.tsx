import { FileText } from "lucide-react";
import { getInvoices } from "@/actions/invoices";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { InvoicesTable } from "@/features/invoices/invoices-table";
export default async function InvoicesPage(){const invoices=(await getInvoices()).data??[];return <div className="space-y-6"><PageHeader title="Invoices" description="Review generated invoices and outstanding balances."/>{invoices.length?<InvoicesTable data={invoices}/>:<EmptyState icon={FileText} title="No invoices" description="Complete a trip or generate an invoice to see it here."/>}</div>}
