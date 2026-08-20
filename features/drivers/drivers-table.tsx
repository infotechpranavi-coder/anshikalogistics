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
import { Pencil, Search, Trash2, Users } from "lucide-react";
import { ModernPanel } from "@/components/shared/modern-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";

export interface DriverRow {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string | null;
  licenseExpiry: Date | string | null;
  salary: number;
  isActive: boolean;
  joiningDate: Date | string | null;
  currentVehicles?: { number: string }[];
}

const license = (value: Date | string | null) => {
  if (!value) return "—";
  const days = Math.ceil((new Date(value).getTime() - Date.now()) / 86400000);
  return (
    <span className={days < 0 ? "text-red-700" : days < 30 ? "text-amber-700" : ""}>
      {formatDate(value)}
      {days < 0 ? " (expired)" : days < 30 ? ` (${days}d)` : ""}
    </span>
  );
};

export function DriversTable({
  data,
  onDelete,
  onBulkDelete,
}: {
  data: DriverRow[];
  onDelete: (id: string) => Promise<void>;
  onBulkDelete: (ids: string[]) => Promise<boolean>;
}) {
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const columns = useMemo<ColumnDef<DriverRow>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all drivers on this page"
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
            aria-label={`Select driver ${row.original.name}`}
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
          />
        ),
      },
      {
        accessorKey: "name",
        header: "Driver",
        cell: ({ row }) => <span className="font-semibold">{row.original.name}</span>,
      },
      { accessorKey: "phone", header: "Phone" },
      {
        accessorKey: "licenseNumber",
        header: "License",
        cell: ({ row }) => row.original.licenseNumber ?? "—",
      },
      {
        accessorKey: "licenseExpiry",
        header: "Expiry",
        cell: ({ row }) => license(row.original.licenseExpiry),
      },
      {
        id: "vehicle",
        header: "Vehicle",
        accessorFn: (row) => row.currentVehicles?.map((vehicle) => vehicle.number).join(", ") || "—",
      },
      {
        accessorKey: "salary",
        header: "Salary",
        cell: ({ row }) => formatCurrency(row.original.salary),
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "success" : "secondary"}>
            {row.original.isActive ? "ACTIVE" : "INACTIVE"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => location.assign(`/drivers/${row.original.id}`)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="text-red-600"
              disabled={busy === row.original.id}
              onClick={async () => {
                if (!confirm(`Delete ${row.original.name}? Assigned vehicles will be unlinked.`)) {
                  return;
                }
                setBusy(row.original.id);
                await onDelete(row.original.id);
                setBusy("");
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
    (id) => rowSelection[id] && data.some((driver) => driver.id === id)
  );
  const selectedCount = selectedIds.length;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const allFilteredSelected = filteredCount > 0 && selectedCount === filteredCount;

  async function handleBulkDelete() {
    if (!selectedCount) return;
    if (
      !confirm(
        `Delete ${selectedCount} selected driver${selectedCount === 1 ? "" : "s"}? Vehicles will be unassigned. Trip history stays. This cannot be undone.`
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
    <ModernPanel title="Driver records" description="Search and manage driver profiles" icon={Users} bodyClassName="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <Input
          className="pl-9"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search drivers…"
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
                Select all {filteredCount} matching drivers
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
        <table className="w-full min-w-225 text-sm">
          <thead className="modern-table-head">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th className="px-4 py-3" key={header.id}>
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
                    <td className="whitespace-nowrap px-4 py-3" key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500">
                  No drivers found.
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
