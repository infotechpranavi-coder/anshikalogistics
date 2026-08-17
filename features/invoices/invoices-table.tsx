"use client";

import { useMemo, useState } from "react";
import {
  type ColumnDef,
  type RowSelectionState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Download, Eye, Printer, Search, Trash2 } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";

export interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  invoiceDate: Date | string;
  status: "DRAFT" | "GENERATED" | "SENT" | "PAID" | "CANCELLED";
  grandTotal: number;
  paidAmount: number;
  pendingAmount: number;
  pdfUrl: string | null;
  trip: {
    tripNumber: string;
    source: string;
    destination: string;
    vehicle: { number: string };
    driver: { name: string } | null;
  };
}

const variants: Record<InvoiceRow["status"], BadgeProps["variant"]> = {
  DRAFT: "secondary",
  GENERATED: "info",
  SENT: "warning",
  PAID: "success",
  CANCELLED: "destructive",
};

export function InvoicesTable({
  data,
  onDelete,
  onBulkDelete,
}: {
  data: InvoiceRow[];
  onDelete: (id: string) => Promise<void>;
  onBulkDelete: (ids: string[]) => Promise<boolean>;
}) {
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const columns = useMemo<ColumnDef<InvoiceRow>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all invoices on this page"
            checked={
              table.getIsAllPageRowsSelected()
                ? true
                : table.getIsSomePageRowsSelected()
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select invoice ${row.original.invoiceNumber}`}
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
          />
        ),
      },
      {
        accessorKey: "invoiceNumber",
        header: "Invoice",
        cell: ({ row }) => <span className="font-semibold">{row.original.invoiceNumber}</span>,
      },
      {
        accessorKey: "invoiceDate",
        header: "Date",
        cell: ({ row }) => formatDate(row.original.invoiceDate),
      },
      {
        id: "trip",
        header: "Trip",
        accessorFn: (row) => row.trip.tripNumber,
      },
      {
        id: "vehicle",
        header: "Vehicle",
        accessorFn: (row) => row.trip.vehicle.number,
      },
      {
        id: "route",
        header: "Route",
        accessorFn: (row) => `${row.trip.source} → ${row.trip.destination}`,
      },
      {
        accessorKey: "grandTotal",
        header: "Total",
        cell: ({ row }) => formatCurrency(row.original.grandTotal),
      },
      {
        accessorKey: "pendingAmount",
        header: "Pending",
        cell: ({ row }) => (
          <span className="text-amber-700">{formatCurrency(row.original.pendingAmount)}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <Badge variant={variants[row.original.status]}>{row.original.status}</Badge>,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const invoice = row.original;
          return (
            <div className="flex justify-end gap-1">
              <Button size="icon" variant="ghost" title="View" onClick={() => location.assign(`/invoices/${invoice.id}`)}>
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                title="Print"
                onClick={() => location.assign(`/invoices/${invoice.id}?print=1`)}
              >
                <Printer className="h-4 w-4" />
              </Button>
              {invoice.pdfUrl ? (
                <Button
                  size="icon"
                  variant="ghost"
                  title="Download PDF"
                  onClick={() => window.open(invoice.pdfUrl!, "_blank")}
                >
                  <Download className="h-4 w-4" />
                </Button>
              ) : null}
              <Button
                size="icon"
                variant="ghost"
                title="Delete"
                className="text-red-600"
                disabled={busy === invoice.id}
                onClick={async () => {
                  if (!confirm(`Delete invoice ${invoice.invoiceNumber}?`)) return;
                  setBusy(invoice.id);
                  await onDelete(invoice.id);
                  setBusy(null);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [busy, onDelete]
  );

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter: search, rowSelection },
    onGlobalFilterChange: setSearch,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const selectedIds = Object.keys(rowSelection).filter(
    (id) => rowSelection[id] && data.some((invoice) => invoice.id === id)
  );
  const selectedCount = selectedIds.length;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const allFilteredSelected = filteredCount > 0 && selectedCount === filteredCount;

  async function handleBulkDelete() {
    if (!selectedCount) return;
    if (
      !confirm(
        `Delete ${selectedCount} selected invoice${selectedCount === 1 ? "" : "s"}? Related payments will also be removed. This cannot be undone.`
      )
    ) {
      return;
    }
    setBulkDeleting(true);
    try {
      const deleted = await onBulkDelete(selectedIds);
      if (deleted) setRowSelection({});
    } finally {
      setBulkDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <Input
          className="pl-9"
          placeholder="Search invoices…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {selectedCount > 0 ? (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-slate-700">
            {selectedCount} selected
            {!allFilteredSelected && filteredCount > selectedCount ? (
              <button
                type="button"
                className="ml-2 text-blue-700 underline-offset-2 hover:underline"
                onClick={() => {
                  const next: RowSelectionState = {};
                  for (const row of table.getFilteredRowModel().rows) next[row.original.id] = true;
                  setRowSelection(next);
                }}
              >
                Select all {filteredCount} matching invoices
              </button>
            ) : null}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setRowSelection({})}>
              Clear
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={bulkDeleting}
              onClick={() => void handleBulkDelete()}
            >
              <Trash2 className="h-4 w-4" />
              {bulkDeleting ? "Deleting…" : `Delete selected (${selectedCount})`}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-237.5 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y">
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className={row.getIsSelected() ? "bg-blue-50/80" : "hover:bg-slate-50"}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="whitespace-nowrap px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500">
                  No invoices found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>
          Previous
        </Button>
        <Button size="sm" variant="outline" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
          Next
        </Button>
      </div>
    </div>
  );
}
