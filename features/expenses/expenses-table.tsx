"use client";

import { useMemo,useState } from "react";
import { flexRender,getCoreRowModel,getFilteredRowModel,useReactTable,type ColumnDef } from "@tanstack/react-table";
import { Search,Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency,formatDate } from "@/lib/utils";
export interface ExpenseRow{id:string;title:string;amount:number;type:string;category:string;date:Date|string;description:string|null;vehicle?:{number:string}|null;driver?:{name:string}|null;trip?:{tripNumber:string}|null}
export function ExpensesTable({data,onDelete}:{data:ExpenseRow[];onDelete:(id:string)=>Promise<void>}){
 const [search,setSearch]=useState("");const columns=useMemo<ColumnDef<ExpenseRow>[]>(()=>[{accessorKey:"date",header:"Date",cell:({row})=>formatDate(row.original.date)},{accessorKey:"title",header:"Title",cell:({row})=><span className="font-medium">{row.original.title}</span>},{accessorKey:"type",header:"Type",cell:({row})=><Badge variant="outline">{row.original.type}</Badge>},{accessorKey:"category",header:"Category",cell:({row})=>row.original.category.replace("_"," ")},{accessorKey:"amount",header:"Amount",cell:({row})=><span className="font-semibold">{formatCurrency(row.original.amount)}</span>},{id:"linked",header:"Linked to",accessorFn:r=>r.vehicle?.number??r.driver?.name??r.trip?.tripNumber??"—"},{id:"actions",header:"",cell:({row})=><Button size="icon" variant="ghost" className="text-red-600" onClick={()=>{if(confirm(`Delete ${row.original.title}?`))void onDelete(row.original.id)}}><Trash2 className="h-4 w-4"/></Button>}],[onDelete]);const table=useReactTable({data,columns,state:{globalFilter:search},onGlobalFilterChange:setSearch,getCoreRowModel:getCoreRowModel(),getFilteredRowModel:getFilteredRowModel()});
 return <div className="space-y-4"><div className="relative max-w-sm"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400"/><Input className="pl-9" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search expenses…"/></div><div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full min-w-[800px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">{table.getHeaderGroups().map(g=><tr key={g.id}>{g.headers.map(h=><th className="px-4 py-3" key={h.id}>{flexRender(h.column.columnDef.header,h.getContext())}</th>)}</tr>)}</thead><tbody className="divide-y">{table.getRowModel().rows.map(r=><tr key={r.id}>{r.getVisibleCells().map(c=><td className="px-4 py-3" key={c.id}>{flexRender(c.column.columnDef.cell,c.getContext())}</td>)}</tr>)}</tbody></table></div></div>
}
