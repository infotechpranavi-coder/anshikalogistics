"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteInvoice, deleteInvoices } from "@/actions/invoices";
import { InvoicesTable, type InvoiceRow } from "@/features/invoices/invoices-table";

export function InvoicesPageTable({ data: initialData }: { data: InvoiceRow[] }) {
  const router = useRouter();
  const [data, setData] = useState(initialData);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  async function handleDelete(id: string) {
    const result = await deleteInvoice(id);
    if (!result.success) {
      toast.error(result.error ?? "Unable to delete the invoice.");
      return;
    }
    setData((current) => current.filter((item) => item.id !== id));
    toast.success("Deleted invoice.");
    router.refresh();
  }

  async function handleBulkDelete(ids: string[]): Promise<boolean> {
    const result = await deleteInvoices(ids);
    if (!result.success) {
      toast.error(result.error ?? "Unable to delete the selected invoices.");
      return false;
    }
    const deletedIds = new Set(ids);
    setData((current) => current.filter((item) => !deletedIds.has(item.id)));
    toast.success(
      result.data?.count === 1
        ? "Deleted 1 invoice."
        : `Deleted ${result.data?.count ?? ids.length} invoices.`
    );
    router.refresh();
    return true;
  }

  return <InvoicesTable data={data} onDelete={handleDelete} onBulkDelete={handleBulkDelete} />;
}
