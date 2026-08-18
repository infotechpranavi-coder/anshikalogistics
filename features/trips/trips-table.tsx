"use client";

import { useMemo, useState } from "react";
import {
  type ColumnDef,
  type RowSelectionState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Copy, Eye, Pencil, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";
import { calculatePendingLt } from "@/utils/calculations";

export interface TripTableRow {
  id: string;
  tripNumber: string;
  tripDate: Date | string;
  vehicle: { number: string } | string;
  driver: { name: string } | string | null;
  source: string;
  destination: string;
  loadingKm: number;
  unloadingKm: number;
  distance: number;
  isLoaded: boolean;
  isEmpty: boolean;
  fuelRequired: number;
  fuelFilled: number;
  fuelCost: number;
  remarks: string | null;
  voucherNumber: string | null;
  grandTotal: number;
  narration: string | null;
  status: "DRAFT" | "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
}

export interface TripsTableProps {
  data: TripTableRow[];
  total?: number;
  page?: number;
  hasMore?: boolean;
  onView?: (trip: TripTableRow) => void;
  onEdit?: (trip: TripTableRow) => void;
  onDuplicate: (trip: TripTableRow) => Promise<void>;
  onDelete: (trip: TripTableRow) => Promise<void>;
  onBulkDelete?: (ids: string[]) => Promise<boolean>;
}

const formatQty = (value: number) => {
  const amount = Number(value) || 0;
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
};

export function TripsTable({
  data,
  total,
  page = 1,
  hasMore = false,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  onBulkDelete,
}: TripsTableProps) {
  const [search, setSearch] = useState("");
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const columns = useMemo<ColumnDef<TripTableRow>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all trips on this page"
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
            aria-label={`Select trip ${row.original.tripNumber}`}
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
          />
        ),
      },
      {
        accessorKey: "tripDate",
        header: "Date",
        cell: ({ row }) => formatDate(row.original.tripDate),
      },
      { accessorKey: "source", header: "From" },
      { accessorKey: "destination", header: "To" },
      {
        accessorKey: "loadingKm",
        header: "Loading KM",
        cell: ({ row }) => formatQty(row.original.loadingKm),
      },
      {
        accessorKey: "unloadingKm",
        header: "Unloading KM",
        cell: ({ row }) => formatQty(row.original.unloadingKm),
      },
      {
        id: "loadedEmpty",
        header: "Loaded empty",
        accessorFn: (row) => (row.isEmpty || !row.isLoaded ? "Empty" : "Loaded"),
      },
      {
        accessorKey: "distance",
        header: "KM",
        cell: ({ row }) => formatQty(row.original.distance),
      },
      {
        accessorKey: "fuelRequired",
        header: "Lt",
        cell: ({ row }) => formatQty(row.original.fuelRequired),
      },
      {
        accessorKey: "fuelFilled",
        header: "Paid Lt",
        cell: ({ row }) => formatQty(row.original.fuelFilled),
      },
      {
        id: "pendingLt",
        header: "Pending Lt",
        cell: ({ row }) =>
          formatQty(calculatePendingLt(row.original.fuelRequired, row.original.fuelFilled)),
      },
      {
        id: "entry",
        header: "Entry",
        accessorFn: (row) => row.remarks?.trim() || "—",
      },
      {
        accessorKey: "fuelCost",
        header: "Desil Amt",
        cell: ({ row }) => formatCurrency(row.original.fuelCost),
      },
      {
        accessorKey: "grandTotal",
        header: "Final Amount",
        cell: ({ row }) => formatCurrency(row.original.grandTotal),
      },
      {
        accessorKey: "narration",
        header: "Narration",
        cell: ({ row }) => (
          <span className="max-w-48 truncate block" title={row.original.narration ?? ""}>
            {row.original.narration || "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        cell: ({ row }) => {
          const trip = row.original;
          const busy = pendingAction === trip.id;
          return (
            <div className="flex justify-end gap-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  onEdit ? onEdit(trip) : window.location.assign(`/trips/${trip.id}/edit`)
                }
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <IconButton
                label="View"
                icon={Eye}
                onClick={() =>
                  onView ? onView(trip) : window.location.assign(`/trips/${trip.id}`)
                }
              />
              <IconButton
                label="Duplicate"
                icon={Copy}
                disabled={busy}
                onClick={() => void runRowAction(trip, onDuplicate)}
              />
              <IconButton
                label="Delete"
                icon={Trash2}
                destructive
                disabled={busy}
                onClick={() => {
                  if (window.confirm(`Delete trip ${trip.tripNumber}? This cannot be undone.`)) {
                    void runRowAction(trip, onDelete);
                  }
                }}
              />
            </div>
          );
        },
      },
    ],
    [onDelete, onDuplicate, onEdit, onView, pendingAction]
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
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const selectedIds = Object.keys(rowSelection).filter(
    (id) => rowSelection[id] && data.some((trip) => trip.id === id)
  );
  const selectedCount = selectedIds.length;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const allFilteredSelected = filteredCount > 0 && selectedCount === filteredCount;
  const totalTrips = total ?? data.length;
  const hasMoreTrips = totalTrips > data.length;

  async function runRowAction(
    trip: TripTableRow,
    handler: (value: TripTableRow) => Promise<void>
  ) {
    setPendingAction(trip.id);
    try {
      await handler(trip);
    } finally {
      setPendingAction(null);
    }
  }

  async function handleBulkDelete() {
    if (!onBulkDelete || !selectedCount) return;
    if (
      !window.confirm(
        `Delete ${selectedCount} selected trip${selectedCount === 1 ? "" : "s"}? This cannot be undone.`
      )
    ) {
      return;
    }
    setBulkDeleting(true);
    try {
      const deleted = await onBulkDelete(selectedIds);
      if (deleted) {
        setRowSelection({});
      }
    } finally {
      setBulkDeleting(false);
    }
  }

  function selectAllFiltered() {
    const next: RowSelectionState = {};
    for (const row of table.getFilteredRowModel().rows) {
      next[row.original.id] = true;
    }
    setRowSelection(next);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search trips…"
              className="pl-9"
            />
          </div>
          <p className="text-xs text-slate-500">
            Showing {data.length} loaded trip{data.length === 1 ? "" : "s"}
            {hasMoreTrips ? ` of ${totalTrips} total` : ""}
            {filteredCount !== data.length ? ` · ${filteredCount} match current filters` : ""}
          </p>
        </div>
      </div>

      {selectedCount > 0 ? (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-slate-700">
            {selectedCount} selected
            {!allFilteredSelected && filteredCount > selectedCount ? (
              <button
                type="button"
                className="ml-2 text-blue-700 underline-offset-2 hover:underline"
                onClick={selectAllFiltered}
              >
                Select all {filteredCount} matching loaded trips
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
              disabled={!onBulkDelete || bulkDeleting}
              onClick={() => void handleBulkDelete()}
            >
              <Trash2 className="h-4 w-4" />
              {bulkDeleting ? "Deleting…" : `Delete selected (${selectedCount})`}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-350 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 font-semibold">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100">
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className={row.getIsSelected() ? "bg-blue-50/80" : "hover:bg-slate-50/70"}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="whitespace-nowrap px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500">No trips found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <p className="text-slate-500">
          Page {table.getState().pagination.pageIndex + 1} of {Math.max(1, table.getPageCount())}
          {page > 1 || hasMore ? ` · batch ${page}` : ""}
        </p>
        <div className="flex gap-2">
          {page > 1 ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/trips?page=${page - 1}`}>Newer</Link>
            </Button>
          ) : null}
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
          {hasMore ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/trips?page=${page + 1}`}>Older</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function IconButton({
  label,
  icon: Icon,
  onClick,
  disabled,
  destructive,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={destructive ? "text-red-600 hover:bg-red-50 hover:text-red-700" : ""}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}

export default TripsTable;
