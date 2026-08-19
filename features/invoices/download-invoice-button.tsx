"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadInvoicePdf } from "@/features/invoices/download-invoice";
import type { LiveInvoiceData } from "@/types";

export function DownloadInvoiceButton({ data }: { data: LiveInvoiceData }) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={async () => {
        try {
          await downloadInvoicePdf(data);
        } catch (error) {
          console.error(error);
          toast.error("Unable to download the invoice PDF.");
        }
      }}
    >
      <Download className="h-4 w-4" />
      Download PDF
    </Button>
  );
}
