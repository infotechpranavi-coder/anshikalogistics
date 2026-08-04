"use client";

import { useMemo, useState } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Copy, Eye, Pencil, Search, Trash2 } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";

export interface TripTableRow {
  id: string;
  tripNumber: string;
  tripDate: Date | string;
  vehicle: { number: string } | string;
  driver: { name: string } | string | null;
  source: string;
  destination: string;
  distance: number;
  grandTotal: number;
  pendingAmount: number;
  status: "DRAFT" | "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
}

export interface TripsTableProps {
  data: TripTableRow[];
  onView?: (trip: TripTableRow) => void;
  onEdit?: (trip: TripTableRow) => void;
  onDuplicate: (trip: TripTableRow) => Promise<void>;
  onDelete: (trip: TripTableRow) => Promise<void>;
}

const statusVariant: Record<TripTableRow["status"], BadgeProps["variant"]> = {
  DRAFT: "secondary",
  PENDING: "warning",
  IN_PROGRESS: "info",
  COMPLETED: "success",
  CANCELLED: "destructive",
};

const relationLabel = (value: { number?: string; name?: string } | string | null) =>
  typeof value === "string" ? value : value?.number ?? value?.name ?? "—";

export function TripsTable({
  data,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
}: TripsTableProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const filteredData = useMemo(
    () => (status === "ALL" ? data : data.filter((trip) => trip.status === status)),
    [data, status]
  );

  const columns = useMemo<ColumnDef<TripTableRow>[]>(
    () => [
      {
        accessorKey: "tripNumber",
        header: "Trip #",
        cell: ({ row }) => <span className="font-semibold">{row.original.tripNumber}</span>,
      },
      {
        accessorKey: "tripDate",
        header: "Date",
        cell: ({ row }) => formatDate(row.original.tripDate),
      },
      {
        id: "vehicle",
        accessorFn: (row) => relationLabel(row.vehicle),
        header: "Vehicle",
      },
      {
        id: "driver",
        accessorFn: (row) => relationLabel(row.driver),
        header: "Driver",
      },
      { accessorKey: "source", header: "Source" },
      { accessorKey: "destination", header: "Destination" },
      {
        accessorKey: "distance",
        header: "Distance",
        cell: ({ row }) => `${row.original.distance.toFixed(2)} km`,
      },
      {
        accessorKey: "grandTotal",
        header: "Grand Total",
        cell: ({ row }) => formatCurrency(row.original.grandTotal),
      },
      {
        accessorKey: "pendingAmount",
        header: "Pending",
        cell: ({ row }) => (
          <span className={row.original.pendingAmount > 0 ? "font-medium text-amber-700" : ""}>
            {formatCurrency(row.original.pendingAmount)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={statusVariant[row.original.status]}>
            {row.original.status.replace("_", " ")}
          </Badge>
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
              <IconButton
                label="View"
                icon={Eye}
                onClick={() =>
                  onView ? onView(trip) : window.location.assign(`/trips/${trip.id}`)
                }
              />
              <IconButton
                label="Edit"
                icon={Pencil}
                onClick={() =>
                  onEdit ? onEdit(trip) : window.location.assign(`/trips/${trip.id}/edit`)
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
    data: filteredData,
    columns,
    state: { globalFilter: search },
    onGlobalFilterChange: setSearch,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search trips…"
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {Object.keys(statusVariant).map((value) => (
              <SelectItem key={value} value={value}>{value.replace("_", " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[1050px] text-sm">
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
                <tr key={row.id} className="hover:bg-slate-50/70">
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
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
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
