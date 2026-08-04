"use client";

import { useState } from "react";
import { Controller,useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { expenseSchema,type ExpenseInput } from "@/schemas";
import type { ActionResult } from "@/types";

type Values=Omit<ExpenseInput,"date">&{date:string};
const categories=["TOLL","PARKING","FOOD","REPAIR","POLICE_FINE","ADVANCE","MISC","FUEL","SALARY","INSURANCE","MAINTENANCE","OTHER"] as const;
export function ExpenseForm({initial,vehicles=[],drivers=[],trips=[],onSubmit}:{initial?:Partial<ExpenseInput>;vehicles?:{id:string;number:string}[];drivers?:{id:string;name:string}[];trips?:{id:string;tripNumber:string}[];onSubmit:(data:ExpenseInput)=>Promise<ActionResult<{id:string}>>}){
 const router=useRouter(),[message,setMessage]=useState("");const {register,control,handleSubmit,formState:{errors,isSubmitting}}=useForm<Values>({defaultValues:{title:initial?.title??"",amount:initial?.amount??0,type:initial?.type??"GENERAL",category:initial?.category??"OTHER",date:initial?.date?new Date(initial.date).toISOString().slice(0,10):new Date().toISOString().slice(0,10),description:initial?.description??"",tripId:initial?.tripId??null,vehicleId:initial?.vehicleId??null,driverId:initial?.driverId??null}});
 const submit=handleSubmit(async v=>{const p=expenseSchema.safeParse(v);if(!p.success){setMessage("Please correct the highlighted fields.");return}const r=await onSubmit(p.data);if(!r.success){setMessage(r.error??"Unable to save expense.");return}router.push("/expenses");router.refresh()});
 const relation=(name:"vehicleId"|"driverId"|"tripId",items:{id:string;label:string}[])=> <Controller control={control} name={name} render={({field})=><Select value={field.value??"NONE"} onValueChange={v=>field.onChange(v==="NONE"?null:v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="NONE">None</SelectItem>{items.map(x=><SelectItem key={x.id} value={x.id}>{x.label}</SelectItem>)}</SelectContent></Select>}/>;
 return <form onSubmit={submit} className="space-y-4"><div className="grid gap-4 rounded-xl border bg-white p-6 sm:grid-cols-2"><Field label="Title" error={errors.title?.message}><Input {...register("title")}/></Field><Field label="Amount" error={errors.amount?.message}><Input type="number" min=".01" step=".01" {...register("amount",{valueAsNumber:true})}/></Field><Field label="Type"><Controller control={control} name="type" render={({field})=><Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{["TRIP","GENERAL","VEHICLE","DRIVER"].map(x=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>}/></Field><Field label="Category"><Controller control={control} name="category" render={({field})=><Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{categories.map(x=><SelectItem key={x} value={x}>{x.replace("_"," ")}</SelectItem>)}</SelectContent></Select>}/></Field><Field label="Date"><Input type="date" {...register("date")}/></Field><Field label="Vehicle">{relation("vehicleId",vehicles.map(v=>({id:v.id,label:v.number})))}</Field><Field label="Driver">{relation("driverId",drivers.map(v=>({id:v.id,label:v.name})))}</Field><Field label="Trip">{relation("tripId",trips.map(v=>({id:v.id,label:v.tripNumber})))}</Field><div className="sm:col-span-2"><Field label="Description"><Textarea {...register("description")}/></Field></div></div>{message&&<p className="text-sm text-red-700">{message}</p>}<div className="flex gap-2"><Button disabled={isSubmitting}>{isSubmitting?"Saving…":"Save expense"}</Button><Button type="button" variant="outline" onClick={()=>router.back()}>Cancel</Button></div></form>
}
function Field({label,error,children}:{label:string;error?:string;children:React.ReactNode}){return <div className="space-y-1.5"><Label>{label}</Label>{children}{error&&<p className="text-xs text-red-600">{error}</p>}</div>}
