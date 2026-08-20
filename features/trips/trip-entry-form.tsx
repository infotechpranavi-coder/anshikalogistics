"use client";

import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import type { FieldPath } from "react-hook-form";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { Fuel, MapPin, Plus, Receipt, Snowflake, Trash2, Truck } from "lucide-react";
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
import { tripSchema, type TripInput } from "@/schemas";
import { APP_LOGO } from "@/lib/brand";
import { cn } from "@/lib/utils";
import {
  calculateAcCharge,
  calculateAcLitres,
  calculateDieselAmount,
  calculateEntry,
  calculateFuelRequired,
  calculateGrandTotal,
  calculateTotalAmount,
  calculatePendingLt,
  hoursBetweenTimes,
  DEFAULT_AC_LITRES_PER_HOUR,
} from "@/utils/calculations";
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
    acHours?: number;
    acLitresPerHour?: number;
    acStartTime?: string;
    acEndTime?: string;
    acPaidLt?: number;
    extraExpenses?: { title: string; amount: number }[];
    tripNumber?: string;
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
    bankName?: string | null;
    bankAccount?: string | null;
    bankIfsc?: string | null;
    bankBranch?: string | null;
    city?: string | null;
    state?: string | null;
  };
  nextInvoiceNumber: string;
  onSubmit: (data: TripInput & { status: string }) => Promise<void>;
  onSaveDraft: (data: TripInput) => Promise<void>;
  onGenerateInvoice: (
    data: TripInput
  ) => Promise<{ invoiceNumber: string; invoiceId: string; tripId: string }>;
  onInvoiceGenerated?: (info: { invoiceNumber: string; tripId: string }) => void;
  onRegisterActions?: (actions: {
    draft: () => void;
    save: () => void;
    invoice: () => void;
  }) => void;
  onBusyChange?: (action: string | null) => void;
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
  drivers = [],
  defaultValues,
  company,
  nextInvoiceNumber,
  onSubmit,
  onSaveDraft,
  onGenerateInvoice,
  onInvoiceGenerated,
  onRegisterActions,
  onBusyChange,
  onChangeLiveData,
}: TripEntryFormProps) {
  const [action, setAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const actionsRef = useRef({
    draft: () => {},
    save: () => {},
    invoice: () => {},
  });
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
      dieselRate: defaultValues?.dieselRate ?? 100,
      mileage: defaultValues?.mileage ?? 6,
      fuelFilled: defaultValues?.fuelFilled ?? 0,
      fuelRequired: defaultValues?.fuelRequired ?? 0,
      fuelCost: defaultValues?.fuelCost ?? 0,
      acHours: defaultValues?.acHours ?? 0,
      acLitresPerHour: defaultValues?.acLitresPerHour ?? DEFAULT_AC_LITRES_PER_HOUR,
      acStartTime: defaultValues?.acStartTime ?? "",
      acEndTime: defaultValues?.acEndTime ?? "",
      acPaidLt: defaultValues?.acPaidLt ?? 0,
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
      extraExpenses: defaultValues?.extraExpenses ?? [],
    },
  });
  const { fields: extraExpenseFields, append, remove } = useFieldArray({
    control,
    name: "extraExpenses",
  });

  const loadingKm = numberValue(useWatch({ control, name: "loadingKm" }));
  const unloadingKm = numberValue(useWatch({ control, name: "unloadingKm" }));
  const distance = numberValue(useWatch({ control, name: "distance" }));
  const mileage = numberValue(useWatch({ control, name: "mileage" }));
  const dieselRate = numberValue(useWatch({ control, name: "dieselRate" }));
  const fuelRequired = numberValue(useWatch({ control, name: "fuelRequired" }));
  const fuelFilled = numberValue(useWatch({ control, name: "fuelFilled" }));
  const acHours = numberValue(useWatch({ control, name: "acHours" }));
  const acLitresPerHour = numberValue(useWatch({ control, name: "acLitresPerHour" }));
  const acStartTime = useWatch({ control, name: "acStartTime" }) ?? "";
  const acEndTime = useWatch({ control, name: "acEndTime" }) ?? "";
  const acPaidLt = numberValue(useWatch({ control, name: "acPaidLt" }));
  const acHoursFromTimes = hoursBetweenTimes(acStartTime, acEndTime);
  const acUsageHours = acHoursFromTimes ?? acHours;
  const acLitres = calculateAcLitres(acUsageHours, acLitresPerHour);
  const pendingLt = calculatePendingLt(fuelRequired, fuelFilled, acLitres);
  const tripDieselLt = calculatePendingLt(fuelRequired, fuelFilled, 0);
  const loadStatus = useWatch({ control, name: "isEmpty" }) ? "empty" : "loaded";
  const entry = calculateEntry(distance, loadStatus === "loaded");
  const acCharge = calculateAcCharge(acUsageHours, acLitresPerHour, dieselRate, acPaidLt);
  const dieselAmt = calculateDieselAmount(tripDieselLt, dieselRate);
  const values = watch();
  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === values.vehicleId);
  const selectedDriver = drivers.find((d) => d.id === values.driverId) ?? null;
  const extraExpenses = (values.extraExpenses ?? []).filter(
    (item) => item.title?.trim() && numberValue(item.amount) > 0
  );
  const extraTotal = extraExpenses.reduce((sum, item) => sum + numberValue(item.amount), 0);
  const tripAmount = calculateGrandTotal(entry, dieselAmt, extraTotal);
  const totalAmount = calculateTotalAmount(tripAmount, acCharge);

  useEffect(() => {
    const km = Math.max(0, unloadingKm - loadingKm);
    setValue("distance", km, { shouldDirty: false });
  }, [loadingKm, unloadingKm, setValue]);

  useEffect(() => {
    if (acHoursFromTimes == null) return;
    setValue("acHours", acHoursFromTimes, { shouldDirty: false });
  }, [acHoursFromTimes, setValue]);

  useEffect(() => {
    const lt = calculateFuelRequired(distance, mileage);
    const tripDieselLt = calculatePendingLt(lt, fuelFilled, 0);
    setValue("fuelRequired", lt, { shouldDirty: false });
    setValue("fuelCost", calculateDieselAmount(tripDieselLt, dieselRate), {
      shouldDirty: false,
    });
  }, [distance, mileage, dieselRate, fuelFilled, acHours, acLitresPerHour, setValue]);

  useEffect(() => {
    setValue("grandTotal", totalAmount, { shouldDirty: false });
    setValue("miscExpense", extraTotal, { shouldDirty: false });
    setValue("remarks", entry.toFixed(2), { shouldDirty: false });
  }, [entry, extraTotal, totalAmount, setValue]);

  useEffect(() => {
    onChangeLiveData?.({
      invoiceNumber: nextInvoiceNumber,
      tripDate: values.tripDate || new Date(),
      companyName: company.name,
      companyLogo: company.logo || APP_LOGO,
      companyAddress: company.address,
      companyPhone: company.phone,
      companyEmail: company.email,
      companyGst: company.gst,
      vehicleNumber: selectedVehicle?.number ?? defaultValues?.vehicleNumber ?? "",
      vehicleType: selectedVehicle?.type ?? defaultValues?.vehicleType ?? "",
      owner: selectedVehicle?.owner ?? defaultValues?.owner ?? undefined,
      driverName: selectedDriver?.name ?? defaultValues?.driverName,
      driverPhone: values.driverPhone,
      source: values.source,
      destination: values.destination,
      loadingKm,
      unloadingKm,
      distance: numberValue(values.distance),
      dieselRate,
      mileage,
      fuelFilled,
      fuelRequired,
      fuelCost: dieselAmt,
      acHours: acUsageHours,
      acLitresPerHour,
      acCharge,
      acPaidLt,
      toll: 0,
      parking: 0,
      food: 0,
      repair: 0,
      policeFine: 0,
      advance: 0,
      miscExpense: extraTotal,
      expenseTotal: extraTotal,
      grandTotal: totalAmount,
      paidAmount: numberValue(values.paidAmount),
      pendingAmount: totalAmount - numberValue(values.paidAmount),
      voucherNumber: values.voucherNumber,
      remarks: values.remarks,
      extraExpenses: (values.extraExpenses ?? []).filter(
        (item) => item.title?.trim() && numberValue(item.amount) > 0
      ),
      signature: company.signature,
      upiId: company.upiId,
      tripNumber: defaultValues?.tripNumber,
      isLoaded: loadStatus === "loaded",
      isEmpty: loadStatus === "empty",
      bankName: company.bankName,
      bankAccount: company.bankAccount,
      bankIfsc: company.bankIfsc,
      bankBranch: company.bankBranch,
    });
  }, [
    company,
    drivers,
    defaultValues?.owner,
    defaultValues?.vehicleNumber,
    defaultValues?.vehicleType,
    defaultValues?.tripNumber,
    defaultValues?.driverName,
    dieselAmt,
    extraTotal,
    totalAmount,
    fuelFilled,
    fuelRequired,
    acHours,
    acLitresPerHour,
    acCharge,
    acPaidLt,
    acUsageHours,
    loadingKm,
    nextInvoiceNumber,
    onChangeLiveData,
    selectedVehicle,
    unloadingKm,
    dieselRate,
    mileage,
    values.destination,
    values.distance,
    values.driverId,
    values.driverPhone,
    values.extraExpenses,
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
      dieselRate: numberValue(values.dieselRate),
      mileage: numberValue(values.mileage),
      fuelRequired: numberValue(values.fuelRequired),
      fuelFilled: numberValue(values.fuelFilled),
      fuelCost: numberValue(values.fuelCost),
      acHours: numberValue(values.acHours),
      acLitresPerHour: numberValue(values.acLitresPerHour),
      acPaidLt: numberValue(values.acPaidLt),
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

  const runAction = async (kind: "draft" | "save" | "invoice") => {
    const parsed = parseValues(kind === "draft" ? "DRAFT" : "COMPLETED");
    if (!parsed) return;
    setAction(kind);
    onBusyChange?.(kind);
    setActionError(null);
    try {
      if (kind === "draft") await onSaveDraft(parsed);
      else if (kind === "invoice") {
        const invoice = await onGenerateInvoice({ ...parsed, status: "COMPLETED" });
        onInvoiceGenerated?.({ invoiceNumber: invoice.invoiceNumber, tripId: invoice.tripId });
      } else await onSubmit({ ...parsed, status: "COMPLETED" });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "digest" in error &&
        typeof (error as { digest?: unknown }).digest === "string" &&
        (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
      ) {
        throw error;
      }
      setActionError(
        error instanceof Error
          ? error.message
          : kind === "invoice"
            ? "Unable to generate the invoice."
            : "Unable to save the trip."
      );
    } finally {
      setAction(null);
      onBusyChange?.(null);
    }
  };

  actionsRef.current = {
    draft: () => {
      void runAction("draft");
    },
    save: () => {
      void runAction("save");
    },
    invoice: () => {
      void runAction("invoice");
    },
  };

  useEffect(() => {
    onRegisterActions?.({
      draft: () => actionsRef.current.draft(),
      save: () => actionsRef.current.save(),
      invoice: () => actionsRef.current.invoice(),
    });
  }, [onRegisterActions]);

  return (
    <form
      className="space-y-5 scheme-light [&_input]:rounded-xl [&_input]:border-slate-200/90 [&_input]:bg-white [&_input]:text-slate-900 [&_input]:shadow-sm [&_input]:placeholder:text-slate-400 [&_textarea]:rounded-xl [&_textarea]:border-slate-200/90 [&_textarea]:bg-white [&_textarea]:text-slate-900"
      onSubmit={(event) => {
        event.preventDefault();
        void runAction("save");
      }}
      noValidate
    >
      <section className="overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)]">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-teal-50/40 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/20">
              <Truck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">Trip details</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Same columns as the vehicle diesel expense sheet
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8 p-5 sm:p-6">
          <FormSection title="Logistics" icon={MapPin} description="Date, vehicle, driver, and route">
            <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Date" error={errors.tripDate?.message}>
              <Input type="date" {...register("tripDate")} />
            </Field>

            <Field label="Vehicle" error={errors.vehicleId?.message}>
              <Controller
                control={control}
                name="vehicleId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Driver">
              {drivers.length ? (
                <Controller
                  control={control}
                  name="driverId"
                  render={({ field }) => {
                    const currentId = (field.value ?? null) as string | null;
                    return (
                      <Select
                        value={currentId ?? "NONE"}
                        onValueChange={(value) => {
                          const picked = value === "NONE" ? null : value;
                          field.onChange(picked);

                          const d = drivers.find((x) => x.id === picked);
                          setValue("driverPhone", d?.phone ?? "");
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select driver" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">None</SelectItem>
                          {drivers.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  }}
                />
              ) : (
                <Input
                  value={defaultValues?.driverName ?? ""}
                  readOnly
                  tabIndex={-1}
                  className="bg-slate-50"
                />
              )}
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="From" error={errors.source?.message}>
              <Input {...register("source")} placeholder="From" />
            </Field>
            <Field label="To" error={errors.destination?.message}>
              <Input {...register("destination")} placeholder="To" />
            </Field>
          </div>
          </FormSection>

          <FormSection title="Distance & diesel" icon={Fuel} description="KM readings, mileage, and fuel litres">
          <div className="grid gap-4 sm:grid-cols-4">
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
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="loaded">Loaded</SelectItem>
                      <SelectItem value="empty">Empty</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <NumberField
              label="Loading KM"
              name="loadingKm"
              register={register}
              error={errors.loadingKm?.message}
            />
            <NumberField
              label="Unloading KM"
              name="unloadingKm"
              register={register}
              error={errors.unloadingKm?.message}
            />
            <NumberField
              label="KM"
              name="distance"
              register={register}
              error={errors.distance?.message}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField
              label="Mileage (km/l)"
              name="mileage"
              register={register}
              error={errors.mileage?.message}
            />
            <NumberField
              label="Cost per Lt"
              name="dieselRate"
              register={register}
              error={errors.dieselRate?.message}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Lt">
              <Input
                value={fuelRequired.toFixed(2)}
                readOnly
                tabIndex={-1}
                className="readonly-field"
              />
            </Field>
            <NumberField label="Paid Lt" name="fuelFilled" register={register} error={errors.fuelFilled?.message} />
            <Field label="Pending Lt">
              <Input
                value={pendingLt.toFixed(2)}
                readOnly
                tabIndex={-1}
                className="readonly-field"
              />
            </Field>
          </div>
          </FormSection>

          <FormSection title="Trip financials" icon={Receipt} description="Entry, diesel amount, and trip total">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Entry">
              <Input
                value={entry.toFixed(2)}
                readOnly
                tabIndex={-1}
                className="readonly-field"
              />
            </Field>
            <Field label="Desil Amt">
              <Input
                value={dieselAmt.toFixed(2)}
                readOnly
                tabIndex={-1}
                className="readonly-field"
              />
            </Field>
            <Field label="Trip Amount">
              <Input
                value={tripAmount.toFixed(2)}
                readOnly
                tabIndex={-1}
                className={cn(
                  "readonly-field font-semibold",
                  tripAmount < 0 ? "text-red-600" : "text-teal-800"
                )}
              />
            </Field>
          </div>
          </FormSection>

          <FormSection title="AC charges" icon={Snowflake} description="Usage hours, litres, and AC diesel amount">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <NumberField
              label="AC per hour"
              name="acLitresPerHour"
              register={register}
              error={errors.acLitresPerHour?.message}
            />
            <Field label="Start" error={errors.acStartTime?.message}>
              <Input type="time" {...register("acStartTime")} />
            </Field>
            <Field label="End" error={errors.acEndTime?.message}>
              <Input type="time" {...register("acEndTime")} />
            </Field>
            <Field label="Total AC usage" error={errors.acHours?.message}>
              <Input
                type="number"
                min="0"
                step="0.01"
                readOnly={acHoursFromTimes != null}
                tabIndex={acHoursFromTimes != null ? -1 : undefined}
                className={acHoursFromTimes != null ? "readonly-field" : undefined}
                {...register("acHours", { valueAsNumber: true })}
              />
            </Field>
            <Field label="Liter calculator">
              <Input
                value={`${acLitres.toFixed(2)} Ltr`}
                readOnly
                tabIndex={-1}
                className="readonly-field"
              />
            </Field>
            <NumberField
              label="Paid Ltr"
              name="acPaidLt"
              register={register}
              error={errors.acPaidLt?.message}
            />
            <Field label="AC diesel amount">
              <Input
                value={acCharge.toFixed(2)}
                readOnly
                tabIndex={-1}
                className="readonly-field font-medium text-teal-800"
              />
            </Field>
          </div>
          </FormSection>

          <div className="overflow-hidden rounded-2xl border border-teal-200/80 bg-gradient-to-br from-teal-50 via-white to-slate-50 px-5 py-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-700">Total amount</p>
                <p className="mt-2 wrap-break-word font-mono text-sm leading-7 text-slate-700">
                  {formatSignedAmount(tripAmount)} (Trip Amount) {formatSignedAmount(acCharge, true)} (AC charge) ={" "}
                  <span className={`font-semibold ${totalAmount < 0 ? "text-red-600" : "text-slate-950"}`}>
                    {formatSignedAmount(totalAmount)}
                  </span>
                </p>
              </div>
              <p
                className={`text-3xl font-bold tracking-tight ${totalAmount < 0 ? "text-red-600" : "text-slate-950"}`}
              >
                {formatSignedAmount(totalAmount)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)]">
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Receipt className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">Other expenses</h2>
              <p className="mt-0.5 text-sm text-slate-500">Toll, parking, food, repair, or any extra trip cost</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ title: "", amount: 0 })}
            className="rounded-xl border-slate-200 bg-white shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add expense
          </Button>
        </div>
        <div className="space-y-3 p-5 sm:p-6">
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
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center text-sm text-slate-500">
              No other expenses yet. Click Add expense to include extra costs.
            </div>
          )}
          {extraTotal > 0 ? (
            <p className="text-right text-sm font-semibold text-slate-700">
              Other expenses total: {extraTotal.toFixed(2)}
            </p>
          ) : null}
        </div>
      </section>

      {actionError ? (
        <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </p>
      ) : null}
    </form>
  );
}

function FormSection({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/40 p-4 sm:p-5">
      <div className="flex items-start gap-3 border-b border-slate-200/70 pb-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700 ring-1 ring-slate-200/80">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function formatSignedAmount(value: number, withOperator = false) {
  const amount = Math.abs(value).toFixed(2);
  if (!withOperator) return value < 0 ? `−${amount}` : amount;
  return value < 0 ? `− ${amount}` : `+ ${amount}`;
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-[13px] font-semibold text-slate-700">{label}</Label>
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
