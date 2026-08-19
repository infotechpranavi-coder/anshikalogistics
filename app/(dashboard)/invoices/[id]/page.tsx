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
    <div className="space-y-6">
      <PageHeader title={invoice.invoiceNumber} description={`Issued ${formatDate(invoice.invoiceDate)}`}>
        <Badge variant={invoice.status === "PAID" ? "success" : "warning"}>{invoice.status}</Badge>
        <DownloadInvoiceButton data={liveData} />
      </PageHeader>

      <div className="rounded-2xl bg-slate-100 p-4 sm:p-6 print:bg-white print:p-0">
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
