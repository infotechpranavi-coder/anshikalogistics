"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { companySettingsSchema,type CompanySettingsInput } from "@/schemas";
import type { ActionResult } from "@/types";
export function SettingsForm({initial,onSubmit}:{initial:CompanySettingsInput;onSubmit:(data:CompanySettingsInput)=>Promise<ActionResult<{id:string}>>}){
 const [message,setMessage]=useState("");const {register,handleSubmit,formState:{isSubmitting,errors}}=useForm<CompanySettingsInput>({defaultValues:initial});
 const save=handleSubmit(async v=>{const p=companySettingsSchema.safeParse(v);if(!p.success){setMessage("Please correct the company details.");return}const r=await onSubmit(p.data);setMessage(r.success?"Settings saved.":r.error??"Unable to save settings.")});
 const fields:Array<[keyof CompanySettingsInput,string,string?]>=[["name","Company name"],["phone","Phone"],["email","Email","email"],["website","Website"],["city","City"],["state","State"],["pincode","Pincode"],["country","Country"],["gst","GST number"],["invoicePrefix","Invoice prefix"],["invoiceStartingNumber","Starting invoice number","number"],["currency","Currency"],["timezone","Timezone"],["bankName","Bank name"],["bankAccount","Bank account"],["bankIfsc","IFSC"],["upiId","UPI ID"],["logo","Logo URL"],["signature","Signature URL"]];
 return <form onSubmit={save} className="space-y-5"><div className="grid gap-4 rounded-xl border bg-white p-6 sm:grid-cols-2 lg:grid-cols-3">{fields.map(([name,label,type])=><div key={name} className="space-y-1.5"><Label>{label}</Label><Input type={type} {...register(name,{valueAsNumber:type==="number"})}/>{errors[name]&&<p className="text-xs text-red-600">{errors[name]?.message}</p>}</div>)}<div className="sm:col-span-2 lg:col-span-3 space-y-1.5"><Label>Address</Label><Textarea {...register("address")}/></div></div>{message&&<p className={message==="Settings saved."?"text-emerald-700":"text-red-700"}>{message}</p>}<Button disabled={isSubmitting}>{isSubmitting?"Saving…":"Save settings"}</Button></form>
}
