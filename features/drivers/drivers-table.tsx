"use client";

import { useMemo,useState } from "react";
import { flexRender,getCoreRowModel,getFilteredRowModel,useReactTable,type ColumnDef } from "@tanstack/react-table";
import { Pencil,Search,Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency,formatDate } from "@/lib/utils";

export interface DriverRow{id:string;name:string;phone:string;licenseNumber:string|null;licenseExpiry:Date|string|null;salary:number;isActive:boolean;joiningDate:Date|string|null;currentVehicles?:{number:string}[]}
const license=(v:Date|string|null)=>{if(!v)return "—";const d=Math.ceil((new Date(v).getTime()-Date.now())/86400000);return <span className={d<0?"text-red-700":d<30?"text-amber-700":""}>{formatDate(v)}{d<0?" (expired)":d<30?` (${d}d)`:""}</span>};
export function DriversTable({data,onDelete}:{data:DriverRow[];onDelete:(id:string)=>Promise<void>}){
 const [search,setSearch]=useState("");const [busy,setBusy]=useState("");
 const columns=useMemo<ColumnDef<DriverRow>[]>(()=>[
  {accessorKey:"name",header:"Driver",cell:({row})=><span className="font-semibold">{row.original.name}</span>},{accessorKey:"phone",header:"Phone"},{accessorKey:"licenseNumber",header:"License",cell:({row})=>row.original.licenseNumber??"—"},{accessorKey:"licenseExpiry",header:"Expiry",cell:({row})=>license(row.original.licenseExpiry)},{id:"vehicle",header:"Vehicle",accessorFn:r=>r.currentVehicles?.map(v=>v.number).join(", ")||"—"},{accessorKey:"salary",header:"Salary",cell:({row})=>formatCurrency(row.original.salary)},{accessorKey:"isActive",header:"Status",cell:({row})=><Badge variant={row.original.isActive?"success":"secondary"}>{row.original.isActive?"ACTIVE":"INACTIVE"}</Badge>},{id:"actions",header:"",cell:({row})=><div className="flex justify-end"><Button size="icon" variant="ghost" onClick={()=>location.assign(`/drivers/${row.original.id}`)}><Pencil className="h-4 w-4"/></Button><Button size="icon" variant="ghost" className="text-red-600" disabled={busy===row.original.id} onClick={async()=>{if(confirm(`Delete ${row.original.name}?`)){setBusy(row.original.id);await onDelete(row.original.id);setBusy("");}}}><Trash2 className="h-4 w-4"/></Button></div>}
 ],[busy,onDelete]);const table=useReactTable({data,columns,state:{globalFilter:search},onGlobalFilterChange:setSearch,getCoreRowModel:getCoreRowModel(),getFilteredRowModel:getFilteredRowModel()});
 return <div className="space-y-4"><div className="relative max-w-sm"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400"/><Input className="pl-9" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search drivers…"/></div><div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full min-w-[900px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">{table.getHeaderGroups().map(g=><tr key={g.id}>{g.headers.map(h=><th className="px-4 py-3" key={h.id}>{flexRender(h.column.columnDef.header,h.getContext())}</th>)}</tr>)}</thead><tbody className="divide-y">{table.getRowModel().rows.map(r=><tr key={r.id}>{r.getVisibleCells().map(c=><td className="whitespace-nowrap px-4 py-3" key={c.id}>{flexRender(c.column.columnDef.cell,c.getContext())}</td>)}</tr>)}</tbody></table></div></div>
}
