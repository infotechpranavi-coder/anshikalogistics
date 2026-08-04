"use client";

import { useEffect, useMemo, useState } from "react";
import type { FieldPath } from "react-hook-form";
import { Controller, useForm } from "react-hook-form";
import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import {
  Download,
  FileCheck2,
  Mail,
  MessageCircle,
  Printer,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { InvoicePdfDocument } from "@/features/invoices/invoice-pdf";
import { formatCurrency } from "@/lib/utils";
import { tripSchema, type TripInput } from "@/schemas";
import type { LiveInvoiceData, TripFormValues } from "@/types";
import { calculateTripTotals } from "@/utils/calculations";

type TripFields = Omit<TripInput, "tripDate"> & { tripDate: string };

export interface TripEntryFormProps {
  vehicles: {
    id: string;
    number: string;
    type: string;
    owner: string | null;
    fuelType: string;
    mileage: number;
  }[];
  drivers: { id: string; name: string; phone: string }[];
  defaultValues?: Partial<TripFormValues>;
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

const numericFields: Array<{
  name: Exclude<
    keyof TripFields,
    | "vehicleId"
    | "driverId"
    | "driverPhone"
    | "tripDate"
    | "tripTime"
    | "source"
    | "destination"
    | "isLoaded"
    | "isEmpty"
    | "remarks"
    | "voucherNumber"
    | "narration"
    | "paymentMethod"
    | "status"
  >;
  label: string;
}> = [
  { name: "toll", label: "Toll" },
  { name: "parking", label: "Parking" },
  { name: "food", label: "Food" },
  { name: "repair", label: "Repair" },
  { name: "policeFine", label: "Police Fine" },
  { name: "advance", label: "Advance" },
  { name: "miscExpense", label: "Misc. Expense" },
];

const toDateInput = (date?: Date | string) => {
  const value = date ? new Date(date) : new Date();
  if (Number.isNaN(value.getTime())) return "";
  const offset = value.getTimezoneOffset();
  return new Date(value.getTime() - offset * 60_000).toISOString().slice(0, 10);
};

const numberValue = (value: unknown) => Number(value) || 0;

export function TripEntryForm({
  vehicles,
  drivers,
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
      isLoaded: defaultValues?.isLoaded ?? true,
      isEmpty: defaultValues?.isEmpty ?? false,
      remarks: defaultValues?.remarks ?? "",
      dieselRate: defaultValues?.dieselRate ?? 0,
      mileage: defaultValues?.mileage ?? 0,
      fuelFilled: defaultValues?.fuelFilled ?? 0,
      toll: defaultValues?.toll ?? 0,
      parking: defaultValues?.parking ?? 0,
      food: defaultValues?.food ?? 0,
      repair: defaultValues?.repair ?? 0,
      policeFine: defaultValues?.policeFine ?? 0,
      advance: defaultValues?.advance ?? 0,
      miscExpense: defaultValues?.miscExpense ?? 0,
      voucherNumber: defaultValues?.voucherNumber ?? "",
      narration: defaultValues?.narration ?? "",
      paidAmount: defaultValues?.paidAmount ?? 0,
      paymentMethod: defaultValues?.paymentMethod ?? "CASH",
      status: defaultValues?.status ?? "PENDING",
    },
  });

  const values = watch();
  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === values.vehicleId);
  const selectedDriver = drivers.find((driver) => driver.id === values.driverId);
  const totals = calculateTripTotals({
    loadingKm: numberValue(values.loadingKm),
    unloadingKm: numberValue(values.unloadingKm),
    mileage: numberValue(values.mileage),
    dieselRate: numberValue(values.dieselRate),
    fuelFilled: numberValue(values.fuelFilled),
    toll: numberValue(values.toll),
    parking: numberValue(values.parking),
    food: numberValue(values.food),
    repair: numberValue(values.repair),
    policeFine: numberValue(values.policeFine),
    advance: numberValue(values.advance),
    miscExpense: numberValue(values.miscExpense),
    paidAmount: numberValue(values.paidAmount),
  });

  const liveData = useMemo<LiveInvoiceData>(
    () => ({
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
      driverName: selectedDriver?.name ?? defaultValues?.driverName,
      driverPhone: values.driverPhone,
      source: values.source,
      destination: values.destination,
      loadingKm: numberValue(values.loadingKm),
      unloadingKm: numberValue(values.unloadingKm),
      distance: totals.distance,
      dieselRate: numberValue(values.dieselRate),
      mileage: numberValue(values.mileage),
      fuelFilled: numberValue(values.fuelFilled),
      fuelRequired: totals.fuelRequired,
      fuelCost: totals.fuelCost,
      toll: numberValue(values.toll),
      parking: numberValue(values.parking),
      food: numberValue(values.food),
      repair: numberValue(values.repair),
      policeFine: numberValue(values.policeFine),
      advance: numberValue(values.advance),
      miscExpense: numberValue(values.miscExpense),
      expenseTotal: totals.expenseTotal,
      grandTotal: totals.grandTotal,
      paidAmount: numberValue(values.paidAmount),
      pendingAmount: totals.pendingAmount,
      paymentMethod: values.paymentMethod ?? undefined,
      voucherNumber: values.voucherNumber,
      narration: values.narration,
      remarks: values.remarks,
      signature: company.signature,
      upiId: company.upiId,
    }),
    [
      company,
      defaultValues?.driverName,
      defaultValues?.owner,
      defaultValues?.vehicleNumber,
      defaultValues?.vehicleType,
      nextInvoiceNumber,
      selectedDriver?.name,
      selectedVehicle,
      totals.distance,
      totals.expenseTotal,
      totals.fuelCost,
      totals.fuelRequired,
      totals.grandTotal,
      totals.pendingAmount,
      values.advance,
      values.destination,
      values.dieselRate,
      values.driverPhone,
      values.food,
      values.fuelFilled,
      values.loadingKm,
      values.mileage,
      values.miscExpense,
      values.narration,
      values.paidAmount,
      values.parking,
      values.paymentMethod,
      values.policeFine,
      values.remarks,
      values.repair,
      values.source,
      values.toll,
      values.tripDate,
      values.unloadingKm,
      values.voucherNumber,
    ]
  );

  useEffect(() => {
    onChangeLiveData?.(liveData);
  }, [liveData, onChangeLiveData]);

  const parseValues = (status: TripInput["status"]) => {
    const parsed = tripSchema.safeParse({ ...values, status });
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
    const status = kind === "draft" ? "DRAFT" : kind === "invoice" ? "COMPLETED" : "PENDING";
    const parsed = parseValues(status);
    if (!parsed) return;
    setAction(kind);
    setActionError(null);
    try {
      if (kind === "draft") await onSaveDraft(parsed);
      else await onSubmit({ ...parsed, status });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to save the trip.");
    } finally {
      setAction(null);
    }
  };

  const downloadPdf = async () => {
    setAction("pdf");
    setActionError(null);
    try {
      const blob = await pdf(<InvoicePdfDocument data={liveData} />).toBlob();
      saveAs(blob, `${liveData.invoiceNumber || "invoice"}.pdf`);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to create the PDF.");
    } finally {
      setAction(null);
    }
  };

  const shareWhatsApp = () => {
    const message = [
      `Invoice ${liveData.invoiceNumber}`,
      `${liveData.source} → ${liveData.destination}`,
      `Total: ${formatCurrency(liveData.grandTotal)}`,
      `Pending: ${formatCurrency(liveData.pendingAmount)}`,
    ].join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  const emailInvoice = () => {
    const subject = `Invoice ${liveData.invoiceNumber}`;
    const body = `Trip ${liveData.source} → ${liveData.destination}\nGrand total: ${formatCurrency(
      liveData.grandTotal
    )}\nPending: ${formatCurrency(liveData.pendingAmount)}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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
      <FormSection title="Vehicle Information" description="Vehicle, owner, and driver details">
        <Field label="Vehicle Number" error={errors.vehicleId?.message}>
          <Controller
            control={control}
            name="vehicleId"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  const vehicle = vehicles.find((item) => item.id === value);
                  if (vehicle) setValue("mileage", vehicle.mileage, { shouldDirty: true });
                }}
              >
                <SelectTrigger><SelectValue placeholder="Select vehicle number" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>{vehicle.number}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field label="Vehicle Type"><Input value={selectedVehicle?.type ?? defaultValues?.vehicleType ?? ""} readOnly placeholder="Auto filled" /></Field>
        <Field label="Owner"><Input value={selectedVehicle?.owner ?? defaultValues?.owner ?? ""} readOnly placeholder="Auto filled" /></Field>
        <Field label="Driver" error={errors.driverId?.message}>
          <Controller
            control={control}
            name="driverId"
            render={({ field }) => (
              <Select
                value={field.value ?? "__NONE__"}
                onValueChange={(value) => {
                  const driverId = value === "__NONE__" ? undefined : value;
                  field.onChange(driverId);
                  const driver = drivers.find((item) => item.id === driverId);
                  setValue("driverPhone", driver?.phone ?? "", { shouldDirty: true });
                }}
              >
                <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__NONE__">No driver</SelectItem>
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>{driver.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field label="Driver Phone" error={errors.driverPhone?.message}>
          <Input {...register("driverPhone")} placeholder="Driver phone number" />
        </Field>
        <Field label="Fuel Type"><Input value={selectedVehicle?.fuelType ?? defaultValues?.fuelType ?? ""} readOnly placeholder="Auto filled" /></Field>
      </FormSection>

      <FormSection title="Trip Information" description="Date, route, and kilometer details">
        <Field label="Trip Date" error={errors.tripDate?.message}><Input type="date" {...register("tripDate")} /></Field>
        <Field label="Trip Time" error={errors.tripTime?.message}><Input type="time" {...register("tripTime")} /></Field>
        <Field label="Source" error={errors.source?.message}><Input {...register("source")} placeholder="Loading location" /></Field>
        <Field label="Destination" error={errors.destination?.message}><Input {...register("destination")} placeholder="Unloading location" /></Field>
        <NumberField label="Loading KM" name="loadingKm" register={register} error={errors.loadingKm?.message} />
        <NumberField label="Unloading KM" name="unloadingKm" register={register} error={errors.unloadingKm?.message} />
        <CheckField label="Loaded" name="isLoaded" control={control} />
        <CheckField label="Empty" name="isEmpty" control={control} />
        <div className="sm:col-span-2">
          <Field label="Remarks" error={errors.remarks?.message}><Textarea {...register("remarks")} rows={3} placeholder="Any trip remarks" /></Field>
        </div>
      </FormSection>

      <FormSection title="Fuel Information" description="Diesel rate, mileage, and calculated fuel cost">
        <NumberField label="Diesel Rate" name="dieselRate" register={register} error={errors.dieselRate?.message} />
        <NumberField label="Mileage" name="mileage" register={register} error={errors.mileage?.message} />
        <NumberField label="Fuel Filled" name="fuelFilled" register={register} error={errors.fuelFilled?.message} />
        <Field label="Fuel Required"><Input value={totals.fuelRequired.toFixed(2)} readOnly className="bg-slate-50 font-medium text-slate-700" /></Field>
        <Field label="Fuel Cost"><Input value={formatCurrency(totals.fuelCost)} readOnly className="bg-slate-50 font-medium text-slate-700" /></Field>
      </FormSection>

      <FormSection title="Expense Information" description="Toll, parking, food, and other trip expenses">
        {numericFields.map(({ name, label }) => (
          <NumberField key={name} label={label} name={name} register={register} error={errors[name]?.message} />
        ))}
        <Field label="Voucher Number" error={errors.voucherNumber?.message}><Input {...register("voucherNumber")} placeholder="Voucher number" /></Field>
        <div className="sm:col-span-2">
          <Field label="Narration" error={errors.narration?.message}><Textarea {...register("narration")} rows={3} placeholder="Expense narration" /></Field>
        </div>
      </FormSection>

      <FormSection title="Payment Information" description="Paid amount, pending balance, and payment method">
        <NumberField label="Paid Amount" name="paidAmount" register={register} error={errors.paidAmount?.message} />
        <Field label="Pending Amount"><Input value={formatCurrency(totals.pendingAmount)} readOnly className="bg-slate-50 font-semibold text-slate-800" /></Field>
        <Field label="Payment Method" error={errors.paymentMethod?.message}>
          <Controller
            control={control}
            name="paymentMethod"
            render={({ field }) => (
              <Select value={field.value ?? "CASH"} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder="Select payment method" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="BANK">Bank</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </FormSection>

      {actionError && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</p>}

      <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-5">
        <ActionButton icon={Save} label="Save Draft" busy={action === "draft"} onClick={() => void runAction("draft")} />
        <ActionButton icon={FileCheck2} label={tripId ? "Update Trip" : "Save Trip"} busy={action === "save"} type="submit" />
        <ActionButton icon={FileCheck2} label="Generate Invoice" busy={action === "invoice"} onClick={() => void runAction("invoice")} />
        <ActionButton icon={Printer} label="Print" onClick={() => window.print()} />
        <ActionButton icon={Download} label="Download PDF" busy={action === "pdf"} onClick={() => void downloadPdf()} />
        <ActionButton icon={MessageCircle} label="Share WhatsApp" onClick={shareWhatsApp} />
        <ActionButton icon={Mail} label="Email Invoice" onClick={emailInvoice} />
      </div>
    </form>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-linear-to-r from-slate-50 to-white px-5 py-4">
        <h2 className="text-base font-semibold tracking-tight text-slate-900">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        )}
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-2">{children}</div>
    </section>
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
      <Label className="!text-[13px] !font-semibold !text-slate-800">
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
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

function CheckField({
  label,
  name,
  control,
}: {
  label: string;
  name: "isLoaded" | "isEmpty";
  control: ReturnType<typeof useForm<TripFields>>["control"];
}) {
  return (
    <div className="flex items-center gap-2 pt-7">
      <Controller
        control={control}
        name={name}
        render={({ field }) => <Checkbox checked={field.value} onCheckedChange={field.onChange} />}
      />
      <Label className="!font-semibold !text-slate-800">{label}</Label>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  busy,
  type = "button",
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  busy?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
}) {
  return (
    <Button type={type} variant="outline" disabled={busy} onClick={onClick}>
      <Icon className="h-4 w-4" />
      {busy ? "Working…" : label}
    </Button>
  );
}

export default TripEntryForm;
