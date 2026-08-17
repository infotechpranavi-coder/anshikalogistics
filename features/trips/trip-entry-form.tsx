"use client";

import { useEffect, useState } from "react";
import type { FieldPath } from "react-hook-form";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { FileCheck2, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { tripSchema, type TripInput } from "@/schemas";
import type { LiveInvoiceData, TripFormValues } from "@/types";

type TripFields = Omit<TripInput, "tripDate"> & {
  tripDate: string;
  distance: number;
  fuelRequired: number;
  fuelCost: number;
  grandTotal: number;
  extraExpenses: { title: string; amount: number }[];
};

export interface TripEntryFormProps {
  vehicles: {
    id: string;
    number: string;
    type: string;
    owner: string | null;
    fuelType: string;
    mileage: number;
  }[];
  drivers?: { id: string; name: string; phone: string }[];
  defaultValues?: Partial<TripFormValues> & {
    distance?: number;
    fuelRequired?: number;
    fuelCost?: number;
    grandTotal?: number;
  };
  company: {
    name: string;
    logo?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    gst?: string | null;
    signature?: string | null;
    upiId?: string | null;
    invoicePrefix: string;
  };
  nextInvoiceNumber: string;
  onSubmit: (data: TripInput & { status: string }) => Promise<void>;
  onSaveDraft: (data: TripInput) => Promise<void>;
  onChangeLiveData?: (data: LiveInvoiceData) => void;
  tripId?: string;
}

const toDateInput = (date?: Date | string) => {
  const value = date ? new Date(date) : new Date();
  if (Number.isNaN(value.getTime())) return "";
  const offset = value.getTimezoneOffset();
  return new Date(value.getTime() - offset * 60_000).toISOString().slice(0, 10);
};

const numberValue = (value: unknown) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

export function TripEntryForm({
  vehicles,
  defaultValues,
  company,
  nextInvoiceNumber,
  onSubmit,
  onSaveDraft,
  onChangeLiveData,
  tripId,
}: TripEntryFormProps) {
  const [action, setAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const {
    control,
    register,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TripFields>({
    defaultValues: {
      vehicleId: defaultValues?.vehicleId ?? "",
      driverId: defaultValues?.driverId,
      driverPhone: defaultValues?.driverPhone ?? "",
      tripDate: toDateInput(defaultValues?.tripDate),
      tripTime: defaultValues?.tripTime ?? "",
      source: defaultValues?.source ?? "",
      destination: defaultValues?.destination ?? "",
      loadingKm: defaultValues?.loadingKm ?? 0,
      unloadingKm: defaultValues?.unloadingKm ?? 0,
      distance: defaultValues?.distance ?? 0,
      isLoaded: defaultValues?.isLoaded ?? true,
      isEmpty: defaultValues?.isEmpty ?? false,
      remarks: defaultValues?.remarks ?? "",
      dieselRate: defaultValues?.dieselRate ?? 0,
      mileage: defaultValues?.mileage ?? 0,
      fuelFilled: defaultValues?.fuelFilled ?? 0,
      fuelRequired: defaultValues?.fuelRequired ?? 0,
      fuelCost: defaultValues?.fuelCost ?? 0,
      grandTotal: defaultValues?.grandTotal ?? 0,
      toll: 0,
      parking: 0,
      food: 0,
      repair: 0,
      policeFine: 0,
      advance: 0,
      miscExpense: 0,
      voucherNumber: defaultValues?.voucherNumber ?? "",
      narration: defaultValues?.narration ?? "",
      paidAmount: defaultValues?.paidAmount ?? 0,
      paymentMethod: defaultValues?.paymentMethod ?? "CASH",
      status: defaultValues?.status ?? "PENDING",
      extraExpenses: [],
    },
  });
  const { fields: extraExpenseFields, append, remove } = useFieldArray({
    control,
    name: "extraExpenses",
  });

  const loadingKm = numberValue(watch("loadingKm"));
  const unloadingKm = numberValue(watch("unloadingKm"));
  const fuelRequired = numberValue(watch("fuelRequired"));
  const fuelFilled = numberValue(watch("fuelFilled"));
  const pendingLt = Math.max(0, fuelRequired - fuelFilled);
  const loadStatus = watch("isEmpty") ? "empty" : "loaded";
  const values = watch();
  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === values.vehicleId);
  const extraExpenses = (values.extraExpenses ?? []).filter(
    (item) => item.title?.trim() && numberValue(item.amount) > 0
  );
  const extraTotal = extraExpenses.reduce((sum, item) => sum + numberValue(item.amount), 0);
  const dieselAmt = numberValue(values.fuelCost);
  const finalAmount = dieselAmt + extraTotal;

  useEffect(() => {
    const km = Math.max(0, unloadingKm - loadingKm);
    setValue("distance", km, { shouldDirty: false });
  }, [loadingKm, unloadingKm, setValue]);

  useEffect(() => {
    setValue("grandTotal", finalAmount, { shouldDirty: false });
    setValue("miscExpense", extraTotal, { shouldDirty: false });
  }, [extraTotal, finalAmount, setValue]);

  useEffect(() => {
    onChangeLiveData?.({
      invoiceNumber: nextInvoiceNumber,
      tripDate: values.tripDate || new Date(),
      companyName: company.name,
      companyLogo: company.logo,
      companyAddress: company.address,
      companyPhone: company.phone,
      companyEmail: company.email,
      companyGst: company.gst,
      vehicleNumber: selectedVehicle?.number ?? defaultValues?.vehicleNumber ?? "",
      vehicleType: selectedVehicle?.type ?? defaultValues?.vehicleType ?? "",
      owner: selectedVehicle?.owner ?? defaultValues?.owner ?? undefined,
      driverName: defaultValues?.driverName,
      driverPhone: values.driverPhone,
      source: values.source,
      destination: values.destination,
      loadingKm,
      unloadingKm,
      distance: numberValue(values.distance),
      dieselRate: 0,
      mileage: 0,
      fuelFilled,
      fuelRequired,
      fuelCost: dieselAmt,
      toll: 0,
      parking: 0,
      food: 0,
      repair: 0,
      policeFine: 0,
      advance: 0,
      miscExpense: extraTotal,
      expenseTotal: extraTotal,
      grandTotal: finalAmount,
      paidAmount: numberValue(values.paidAmount),
      pendingAmount: Math.max(0, finalAmount - numberValue(values.paidAmount)),
      voucherNumber: values.voucherNumber,
      narration: values.narration,
      remarks: values.remarks,
      extraExpenses: (values.extraExpenses ?? []).filter(
        (item) => item.title?.trim() && numberValue(item.amount) > 0
      ),
      signature: company.signature,
      upiId: company.upiId,
    });
  }, [
    company,
    defaultValues?.driverName,
    defaultValues?.owner,
    defaultValues?.vehicleNumber,
    defaultValues?.vehicleType,
    dieselAmt,
    extraTotal,
    finalAmount,
    fuelFilled,
    fuelRequired,
    loadingKm,
    nextInvoiceNumber,
    onChangeLiveData,
    selectedVehicle,
    unloadingKm,
    values.destination,
    values.distance,
    values.driverPhone,
    values.extraExpenses,
    values.narration,
    values.paidAmount,
    values.remarks,
    values.source,
    values.tripDate,
    values.voucherNumber,
  ]);

  const parseValues = (status: TripInput["status"]) => {
    const values = watch();
    const parsed = tripSchema.safeParse({
      ...values,
      status,
      distance: numberValue(values.distance),
      fuelRequired: numberValue(values.fuelRequired),
      fuelFilled: numberValue(values.fuelFilled),
      fuelCost: numberValue(values.fuelCost),
      grandTotal: numberValue(values.grandTotal),
      loadingKm: numberValue(values.loadingKm),
      unloadingKm: numberValue(values.unloadingKm),
      extraExpenses: values.extraExpenses ?? [],
    });
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (typeof field === "string") {
          setError(field as FieldPath<TripFields>, { message: issue.message });
        }
      });
      setActionError("Please correct the highlighted fields.");
      return null;
    }
    return parsed.data;
  };

  const runAction = async (kind: "draft" | "save") => {
    const parsed = parseValues(kind === "draft" ? "DRAFT" : "COMPLETED");
    if (!parsed) return;
    setAction(kind);
    setActionError(null);
    try {
      if (kind === "draft") await onSaveDraft(parsed);
      else await onSubmit({ ...parsed, status: "COMPLETED" });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to save the trip.");
    } finally {
      setAction(null);
    }
  };

  return (
    <form
      className="space-y-5 [color-scheme:light] [&_label]:!text-slate-800 [&_input]:border-slate-200 [&_input]:bg-white [&_input]:text-slate-900 [&_input]:placeholder:text-slate-400 [&_button]:border-slate-200 [&_button]:bg-white [&_button]:text-slate-900 [&_textarea]:border-slate-200 [&_textarea]:bg-white [&_textarea]:text-slate-900"
      onSubmit={(event) => {
        event.preventDefault();
        void runAction("save");
      }}
      noValidate
    >
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
          <h2 className="text-base font-semibold tracking-tight text-slate-900">Trip details</h2>
          <p className="mt-0.5 text-xs text-slate-500">Same columns as the vehicle diesel expense sheet</p>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Vehicle" error={errors.vehicleId?.message}>
            <Controller
              control={control}
              name="vehicleId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>{vehicle.number}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="Date" error={errors.tripDate?.message}>
            <Input type="date" {...register("tripDate")} />
          </Field>
          <Field label="From" error={errors.source?.message}>
            <Input {...register("source")} placeholder="From" />
          </Field>
          <Field label="To" error={errors.destination?.message}>
            <Input {...register("destination")} placeholder="To" />
          </Field>
          <NumberField label="Loading KM" name="loadingKm" register={register} error={errors.loadingKm?.message} />
          <NumberField label="Unloading KM" name="unloadingKm" register={register} error={errors.unloadingKm?.message} />
          <Field label="Loaded empty">
            <Controller
              control={control}
              name="isEmpty"
              render={({ field }) => (
                <Select
                  value={loadStatus}
                  onValueChange={(value) => {
                    field.onChange(value === "empty");
                    setValue("isLoaded", value === "loaded");
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="loaded">Loaded</SelectItem>
                    <SelectItem value="empty">Empty</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <NumberField label="KM" name="distance" register={register} error={errors.distance?.message} />
          <NumberField label="Lt" name="fuelRequired" register={register} error={errors.fuelRequired?.message} />
          <NumberField label="Paid Lt" name="fuelFilled" register={register} error={errors.fuelFilled?.message} />
          <Field label="Pending Lt">
            <Input value={pendingLt} readOnly className="bg-slate-50 font-medium text-slate-700" />
          </Field>
          <Field label="Entry" error={errors.remarks?.message}>
            <Input {...register("remarks")} placeholder="Entry" />
          </Field>
          <NumberField label="Desil Amt" name="fuelCost" register={register} error={errors.fuelCost?.message} />
          <Field label="Voucher" error={errors.voucherNumber?.message}>
            <Input {...register("voucherNumber")} placeholder="Voucher" />
          </Field>
          <Field label="Final Amount">
            <Input value={finalAmount} readOnly className="bg-slate-50 font-semibold text-slate-800" />
          </Field>
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="Narration" error={errors.narration?.message}>
              <Textarea {...register("narration")} rows={3} placeholder="Narration" />
            </Field>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-slate-900">Other expenses</h2>
            <p className="mt-0.5 text-xs text-slate-500">Toll, parking, food, repair, or any extra trip cost</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ title: "", amount: 0 })}
          >
            <Plus className="h-4 w-4" />
            Add expense
          </Button>
        </div>
        <div className="space-y-3 p-5">
          {extraExpenseFields.length ? (
            extraExpenseFields.map((field, index) => (
              <div key={field.id} className="grid gap-3 sm:grid-cols-[1fr_160px_auto]">
                <Input {...register(`extraExpenses.${index}.title`)} placeholder="Expense name, e.g. Toll" />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Amount"
                  {...register(`extraExpenses.${index}.amount`, { valueAsNumber: true })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-red-600"
                  onClick={() => remove(index)}
                  aria-label="Remove expense"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No other expenses yet. Click Add expense to include extra costs.</p>
          )}
          {extraTotal > 0 ? (
            <p className="text-right text-sm font-medium text-slate-700">
              Other expenses total: {extraTotal.toFixed(2)}
            </p>
          ) : null}
        </div>
      </section>

      {actionError ? (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={action !== null} onClick={() => void runAction("draft")}>
          <Save className="h-4 w-4" />
          {action === "draft" ? "Saving…" : "Save draft"}
        </Button>
        <Button type="submit" disabled={action !== null}>
          <FileCheck2 className="h-4 w-4" />
          {action === "save" ? "Saving…" : tripId ? "Update trip" : "Save trip"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="!text-[13px] !font-semibold !text-slate-800">{label}</Label>
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

function NumberField({
  label,
  name,
  register,
  error,
}: {
  label: string;
  name: keyof TripFields;
  register: ReturnType<typeof useForm<TripFields>>["register"];
  error?: string;
}) {
  return (
    <Field label={label} error={error}>
      <Input type="number" min="0" step="0.01" {...register(name, { valueAsNumber: true })} />
    </Field>
  );
}

export default TripEntryForm;
