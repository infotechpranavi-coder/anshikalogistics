"use client";

import { useMemo, useState } from "react";
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { Pencil, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";

export interface VehicleRow { id: string; number: string; type: string; make: string | null; model: string | null; status: "ACTIVE"|"MAINTENANCE"|"INACTIVE"|"SOLD"; fuelType: string; mileage: number; insuranceExpiry: Date|string|null; fitnessExpiry: Date|string|null; permitExpiry: Date|string|null; pollutionExpiry: Date|string|null; currentDriver?: { name: string } | null }
const expiry = (value: Date|string|null) => {
  if (!value) return <span className="text-slate-400">—</span>;
  const days = Math.ceil((new Date(value).getTime()-Date.now())/86_400_000);
  return <span className={days<0?"font-medium text-red-700":days<30?"font-medium text-amber-700":""}>{formatDate(value)}{days<0?" (expired)":days<30?` (${days}d)`:""}</span>;
};

export function VehiclesTable({ data, onDelete }: { data: VehicleRow[]; onDelete: (id: string)=>Promise<void> }) {
  const [search,setSearch]=useState("");
  const [busy,setBusy]=useState<string|null>(null);
  const columns=useMemo<ColumnDef<VehicleRow>[]>(()=>[
    {accessorKey:"number",header:"Vehicle",cell:({row})=><span className="font-semibold">{row.original.number}</span>},
    {accessorKey:"type",header:"Type"},
    {id:"make",header:"Make / model",accessorFn:r=>[r.make,r.model].filter(Boolean).join(" ")||"—"},
    {accessorKey:"fuelType",header:"Fuel"},
    {accessorKey:"mileage",header:"Mileage",cell:({row})=>`${row.original.mileage} km/l`},
    {id:"driver",header:"Driver",accessorFn:r=>r.currentDriver?.name??"—"},
    {accessorKey:"status",header:"Status",cell:({row})=><Badge variant={row.original.status==="ACTIVE"?"success":row.original.status==="MAINTENANCE"?"warning":"secondary"}>{row.original.status}</Badge>},
    {accessorKey:"insuranceExpiry",header:"Insurance",cell:({row})=>expiry(row.original.insuranceExpiry)},
    {accessorKey:"permitExpiry",header:"Permit",cell:({row})=>expiry(row.original.permitExpiry)},
    {id:"actions",header:"",cell:({row})=><div className="flex justify-end"><Button size="icon" variant="ghost" onClick={()=>location.assign(`/vehicles/${row.original.id}`)}><Pencil className="h-4 w-4"/></Button><Button size="icon" variant="ghost" disabled={busy===row.original.id} className="text-red-600" onClick={async()=>{if(confirm(`Delete ${row.original.number}?`)){setBusy(row.original.id);await onDelete(row.original.id);setBusy(null);}}}><Trash2 className="h-4 w-4"/></Button></div>},
  ],[busy,onDelete]);
  const table=useReactTable({data,columns,state:{globalFilter:search},onGlobalFilterChange:setSearch,getCoreRowModel:getCoreRowModel(),getFilteredRowModel:getFilteredRowModel(),getPaginationRowModel:getPaginationRowModel()});
  return <div className="space-y-4"><div className="relative max-w-sm"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400"/><Input className="pl-9" placeholder="Search vehicles…" value={search} onChange={e=>setSearch(e.target.value)}/></div><div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full min-w-[1100px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">{table.getHeaderGroups().map(g=><tr key={g.id}>{g.headers.map(h=><th key={h.id} className="px-4 py-3">{flexRender(h.column.columnDef.header,h.getContext())}</th>)}</tr>)}</thead><tbody className="divide-y">{table.getRowModel().rows.map(r=><tr key={r.id} className="hover:bg-slate-50">{r.getVisibleCells().map(c=><td key={c.id} className="whitespace-nowrap px-4 py-3">{flexRender(c.column.columnDef.cell,c.getContext())}</td>)}</tr>)}</tbody></table></div><div className="flex justify-end gap-2"><Button size="sm" variant="outline" disabled={!table.getCanPreviousPage()} onClick={()=>table.previousPage()}>Previous</Button><Button size="sm" variant="outline" disabled={!table.getCanNextPage()} onClick={()=>table.nextPage()}>Next</Button></div></div>;
}
