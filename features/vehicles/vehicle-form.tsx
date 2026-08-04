"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { vehicleSchema, type VehicleInput } from "@/schemas";
import type { ActionResult } from "@/types";

type FormValues = Omit<VehicleInput, "insuranceExpiry" | "fitnessExpiry" | "permitExpiry" | "pollutionExpiry"> & Record<"insuranceExpiry" | "fitnessExpiry" | "permitExpiry" | "pollutionExpiry", string>;
const dateValue = (value?: Date | string | null) => value ? new Date(value).toISOString().slice(0, 10) : "";

export function VehicleForm({ initial, drivers = [], onSubmit }: { initial?: Partial<VehicleInput> & { id?: string }; drivers?: { id: string; name: string }[]; onSubmit: (data: VehicleInput) => Promise<ActionResult<{ id: string }>> }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const { register, control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<FormValues>({ defaultValues: {
    number: initial?.number ?? "", type: initial?.type ?? "", make: initial?.make ?? "", model: initial?.model ?? "", year: initial?.year ?? null, owner: initial?.owner ?? "", fuelType: initial?.fuelType ?? "DIESEL", status: initial?.status ?? "ACTIVE", mileage: initial?.mileage ?? 0, capacity: initial?.capacity ?? null, insuranceNumber: initial?.insuranceNumber ?? "", insuranceExpiry: dateValue(initial?.insuranceExpiry), fitnessExpiry: dateValue(initial?.fitnessExpiry), permitExpiry: dateValue(initial?.permitExpiry), pollutionExpiry: dateValue(initial?.pollutionExpiry), chassisNumber: initial?.chassisNumber ?? "", engineNumber: initial?.engineNumber ?? "", notes: initial?.notes ?? "", currentDriverId: initial?.currentDriverId ?? null,
  } });
  const submit = handleSubmit(async (values) => {
    setMessage("");
    const parsed = vehicleSchema.safeParse(values);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => { const key = issue.path[0]; if (typeof key === "string") setError(key as keyof FormValues, { message: issue.message }); });
      return;
    }
    const result = await onSubmit(parsed.data);
    if (!result.success) { setMessage(result.error ?? "Unable to save vehicle."); return; }
    router.push("/vehicles"); router.refresh();
  });
  const textFields: Array<[keyof FormValues, string, string?]> = [["number","Vehicle number"],["type","Vehicle type"],["make","Make"],["model","Model"],["owner","Owner"],["insuranceNumber","Insurance number"],["chassisNumber","Chassis number"],["engineNumber","Engine number"]];
  const dateFields: Array<[keyof FormValues, string]> = [["insuranceExpiry","Insurance expiry"],["fitnessExpiry","Fitness expiry"],["permitExpiry","Permit expiry"],["pollutionExpiry","Pollution expiry"]];
  return <form onSubmit={submit} className="space-y-6">
    <div className="grid gap-4 rounded-xl border bg-white p-6 sm:grid-cols-2 lg:grid-cols-3">
      {textFields.map(([name,label]) => <Field key={name} label={label} error={errors[name]?.message as string}><Input {...register(name)} /></Field>)}
      <Field label="Year" error={errors.year?.message}><Input type="number" {...register("year", { valueAsNumber: true })} /></Field>
      <Field label="Mileage (km/l)" error={errors.mileage?.message}><Input type="number" min="0" step="0.01" {...register("mileage", { valueAsNumber: true })} /></Field>
      <Field label="Capacity" error={errors.capacity?.message}><Input type="number" min="0" step="0.01" {...register("capacity", { valueAsNumber: true })} /></Field>
      <Field label="Fuel type"><Controller control={control} name="fuelType" render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["DIESEL","PETROL","CNG","ELECTRIC","HYBRID"].map(x=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>} /></Field>
      <Field label="Status"><Controller control={control} name="status" render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["ACTIVE","MAINTENANCE","INACTIVE","SOLD"].map(x=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>} /></Field>
      <Field label="Current driver"><Controller control={control} name="currentDriverId" render={({ field }) => <Select value={field.value ?? "NONE"} onValueChange={v=>field.onChange(v==="NONE"?null:v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="NONE">Unassigned</SelectItem>{drivers.map(d=><SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select>} /></Field>
      {dateFields.map(([name,label]) => <Field key={name} label={label} error={errors[name]?.message as string}><Input type="date" {...register(name)} /></Field>)}
      <div className="sm:col-span-2 lg:col-span-3"><Field label="Notes"><Textarea rows={3} {...register("notes")} /></Field></div>
    </div>
    {message && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{message}</p>}
    <div className="flex gap-2"><Button type="submit" disabled={isSubmitting}>{isSubmitting?"Saving…":"Save vehicle"}</Button><Button type="button" variant="outline" onClick={()=>router.back()}>Cancel</Button></div>
  </form>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}{error&&<p className="text-xs text-red-600">{error}</p>}</div>;
}
