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
import { Eye, Pencil, Search, Trash2, Truck } from "lucide-react";
import { ModernPanel } from "@/components/shared/modern-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export interface VehicleRow {
  id: string;
  number: string;
  type: string;
  make: string | null;
  model: string | null;
  status: "ACTIVE" | "MAINTENANCE" | "INACTIVE" | "SOLD";
  fuelType: string;
  mileage: number;
  insuranceExpiry: Date | string | null;
  fitnessExpiry: Date | string | null;
  permitExpiry: Date | string | null;
  pollutionExpiry: Date | string | null;
  currentDriver?: { name: string } | null;
}

export function VehiclesTable({
  data,
  onDelete,
  onBulkDelete,
}: {
  data: VehicleRow[];
  onDelete: (id: string) => Promise<void>;
  onBulkDelete: (ids: string[]) => Promise<boolean>;
}) {
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const columns = useMemo<ColumnDef<VehicleRow>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all vehicles on this page"
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
            aria-label={`Select vehicle ${row.original.number}`}
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
          />
        ),
      },
      {
        accessorKey: "number",
        header: "Vehicle",
        cell: ({ row }) => <span className="font-semibold">{row.original.number}</span>,
      },
      { accessorKey: "type", header: "Type" },
      { accessorKey: "fuelType", header: "Fuel" },
      {
        id: "driver",
        header: "Driver",
        accessorFn: (row) => row.currentDriver?.name ?? "—",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.status === "ACTIVE"
                ? "success"
                : row.original.status === "MAINTENANCE"
                  ? "warning"
                  : "secondary"
            }
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => location.assign(`/vehicles/${row.original.id}/edit`)}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <Button
              size="icon"
              variant="ghost"
              title="View"
              onClick={() => location.assign(`/vehicles/${row.original.id}`)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              disabled={busy === row.original.id}
              className="text-red-600"
              onClick={async () => {
                if (!confirm(`Delete ${row.original.number}? Linked trips and invoices will also be removed.`)) {
                  return;
                }
                setBusy(row.original.id);
                await onDelete(row.original.id);
                setBusy(null);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
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
    (id) => rowSelection[id] && data.some((vehicle) => vehicle.id === id)
  );
  const selectedCount = selectedIds.length;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const allFilteredSelected = filteredCount > 0 && selectedCount === filteredCount;

  async function handleBulkDelete() {
    if (!selectedCount) return;
    if (
      !confirm(
        `Delete ${selectedCount} selected vehicle${selectedCount === 1 ? "" : "s"}? Linked trips, expenses, and invoices will also be removed. This cannot be undone.`
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
    <ModernPanel title="Vehicle records" description="Search and manage fleet vehicles" icon={Truck} bodyClassName="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <Input
          className="pl-9"
          placeholder="Search vehicles…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {selectedCount > 0 ? (
        <div className="modern-selection-bar">
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
                Select all {filteredCount} matching vehicles
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

      <div className="modern-table-shell">
        <table className="w-full min-w-275 text-sm">
          <thead className="modern-table-head">
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
                  No vehicles found.
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
    </ModernPanel>
  );
}
