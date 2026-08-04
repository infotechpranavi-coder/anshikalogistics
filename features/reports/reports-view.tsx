"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { getDailyReport,getMonthlyReport,getVehicleReport,getDriverReport,getExpenseReport,getFuelReport,getPaymentReport } from "@/actions/reports";
import { Button } from "@/components/ui/button";
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs,TabsList,TabsTrigger } from "@/components/ui/tabs";
import { exportToCsv } from "@/lib/export";
import { formatCurrency } from "@/lib/utils";

type Row=Record<string,string|number|boolean|null|undefined>;
const loaders={daily:getDailyReport,monthly:getMonthlyReport,vehicles:getVehicleReport,drivers:getDriverReport,expenses:getExpenseReport,fuel:getFuelReport,payments:getPaymentReport};
type Kind=keyof typeof loaders;
export function ReportsView(){
 const now=new Date(),month=new Date(now.getFullYear(),now.getMonth(),1);const [kind,setKind]=useState<Kind>("daily"),[from,setFrom]=useState(month.toISOString().slice(0,10)),[to,setTo]=useState(now.toISOString().slice(0,10)),[rows,setRows]=useState<Row[]>([]),[loading,setLoading]=useState(false),[error,setError]=useState("");
 async function run(next:Kind=kind){setKind(next);setLoading(true);setError("");const result=await loaders[next]({from,to});if(result.success)setRows((result.data??[]) as Row[]);else setError("error" in result&&result.error?result.error:"Unable to load report.");setLoading(false)}
 const columns=rows.length?Object.keys(rows[0]).filter(k=>k!=="id"):[];
 return <div className="space-y-5"><Card><CardHeader><CardTitle>Report filters</CardTitle></CardHeader><CardContent className="flex flex-wrap items-end gap-3"><label className="space-y-1 text-sm">From<Input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label className="space-y-1 text-sm">To<Input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label><Button onClick={()=>void run()} disabled={loading}>{loading?"Loading…":"Generate"}</Button>{rows.length>0&&<Button variant="outline" onClick={()=>exportToCsv(`${kind}-${from}-${to}.csv`,rows)}><Download className="h-4 w-4"/>Export CSV</Button>}</CardContent></Card>
 <Tabs value={kind} onValueChange={v=>void run(v as Kind)}><TabsList className="h-auto flex-wrap">{Object.keys(loaders).map(k=><TabsTrigger key={k} value={k}>{k[0].toUpperCase()+k.slice(1)}</TabsTrigger>)}</TabsList></Tabs>
 {error&&<p className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}<div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full min-w-[700px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr>{columns.map(c=><th className="px-4 py-3" key={c}>{c.replace(/([A-Z])/g," $1")}</th>)}</tr></thead><tbody className="divide-y">{rows.map((row,i)=><tr key={i}>{columns.map(c=><td className="px-4 py-3" key={c}>{typeof row[c]==="number"&&/(cost|expense|revenue|paid|pending|amount|total)/i.test(c)?formatCurrency(row[c] as number):String(row[c]??"—")}</td>)}</tr>)}</tbody></table>{!rows.length&&!loading&&<p className="p-12 text-center text-slate-500">Select dates and generate a report.</p>}</div></div>
}
