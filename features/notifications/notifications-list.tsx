"use client";

import { Bell,CheckCheck } from "lucide-react";
import { markAllRead,markAsRead } from "@/actions/notifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
export interface NotificationRow{id:string;title:string;message:string;type:string;isRead:boolean;link:string|null;createdAt:Date|string}
export function NotificationsList({data}:{data:NotificationRow[]}){
 return <div className="space-y-4"><div className="flex justify-end"><Button variant="outline" onClick={async()=>{await markAllRead();location.reload()}}><CheckCheck className="h-4 w-4"/>Mark all read</Button></div><div className="space-y-2">{data.map(n=><button key={n.id} className={`flex w-full gap-4 rounded-xl border p-4 text-left transition hover:border-teal-300 ${n.isRead?"bg-white":"border-teal-200 bg-teal-50/60"}`} onClick={async()=>{if(!n.isRead)await markAsRead(n.id);if(n.link)location.assign(n.link);else location.reload()}}><span className="rounded-full bg-slate-100 p-2 text-teal-700"><Bell className="h-4 w-4"/></span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><strong>{n.title}</strong><Badge variant="outline">{n.type.replaceAll("_"," ")}</Badge></span><span className="mt-1 block text-sm text-slate-600">{n.message}</span><span className="mt-2 block text-xs text-slate-400">{formatDate(n.createdAt,"datetime")}</span></span></button>)}{!data.length&&<p className="rounded-xl border border-dashed p-12 text-center text-slate-500">You have no notifications.</p>}</div></div>
}
