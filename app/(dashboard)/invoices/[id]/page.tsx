import { notFound } from "next/navigation";
import { getInvoiceById, updateInvoiceStatus } from "@/actions/invoices";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { invoiceToLiveData } from "@/features/invoices/invoice-live-data";
import { DownloadInvoiceButton } from "@/features/invoices/download-invoice-button";
import { LiveInvoicePreview } from "@/features/trips/live-invoice-preview";
import { formatDate } from "@/lib/utils";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getInvoiceById(id);
  if (!result.data) notFound();
  const invoice = result.data;

  async function setStatus(form: FormData) {
    "use server";
    await updateInvoiceStatus(id, String(form.get("status")) as typeof invoice.status);
  }

  const liveData = invoiceToLiveData(invoice);

  return (
    <div className="page-stack">
      <PageHeader
        badge="Invoice"
        title={invoice.invoiceNumber}
        description={`Issued ${formatDate(invoice.invoiceDate)}`}
      >
        <Badge variant={invoice.status === "PAID" ? "success" : "warning"}>{invoice.status}</Badge>
        <DownloadInvoiceButton data={liveData} />
      </PageHeader>

      <div className="overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-gradient-to-b from-slate-100 to-white p-4 shadow-sm sm:p-6 print:border-0 print:bg-white print:p-0 print:shadow-none">
        <LiveInvoicePreview data={liveData} fullScreen />
      </div>

      <form action={setStatus} className="flex flex-wrap gap-2 print:hidden">
        {(["GENERATED", "SENT", "PAID", "CANCELLED"] as const).map((status) => (
          <Button key={status} name="status" value={status} variant={status === "PAID" ? "default" : "outline"}>
            Mark {status.toLowerCase()}
          </Button>
        ))}
      </form>
    </div>
  );
}
