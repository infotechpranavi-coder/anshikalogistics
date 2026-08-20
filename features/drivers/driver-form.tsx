"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { driverSchema, type DriverInput } from "@/schemas";
import type { ActionResult } from "@/types";

type Values = Omit<DriverInput, "licenseExpiry" | "joiningDate"> & {
  licenseExpiry: string;
  joiningDate: string;
};

const date = (v?: Date | string | null) => (v ? new Date(v).toISOString().slice(0, 10) : "");

export function DriverForm({
  initial,
  onSubmit,
}: {
  initial?: Partial<DriverInput>;
  onSubmit: (data: DriverInput) => Promise<ActionResult<{ id: string }>>;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    defaultValues: {
      name: initial?.name ?? "",
      phone: initial?.phone ?? "",
      alternatePhone: initial?.alternatePhone ?? "",
      licenseNumber: initial?.licenseNumber ?? "",
      licenseExpiry: date(initial?.licenseExpiry),
      address: initial?.address ?? "",
      salary: initial?.salary ?? 0,
      joiningDate: date(initial?.joiningDate),
      isActive: initial?.isActive ?? true,
      notes: initial?.notes ?? "",
    },
  });

  const submit = handleSubmit(async (values) => {
    const parsed = driverSchema.safeParse({ ...values, salary: initial?.salary ?? 0 });
    if (!parsed.success) {
      parsed.error.issues.forEach((i) => {
        const k = i.path[0];
        if (typeof k === "string") setError(k as keyof Values, { message: i.message });
      });
      return;
    }
    const result = await onSubmit(parsed.data);
    if (!result.success) {
      setMessage(result.error ?? "Unable to save driver.");
      return;
    }
    router.push("/drivers");
    router.refresh();
  });

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" error={errors.name?.message}>
          <Input {...register("name")} />
        </Field>
        <Field label="Phone" error={errors.phone?.message}>
          <Input {...register("phone")} />
        </Field>
        <Field label="Alternate phone">
          <Input {...register("alternatePhone")} />
        </Field>
        <Field label="License number">
          <Input {...register("licenseNumber")} />
        </Field>
        <Field label="License expiry">
          <Input type="date" {...register("licenseExpiry")} />
        </Field>
        <Field label="Joining date">
          <Input type="date" {...register("joiningDate")} />
        </Field>
        <div className="flex items-center gap-2 pt-7">
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
          <Label className="text-slate-700">Active driver</Label>
        </div>
        <div className="sm:col-span-2">
          <Field label="Address">
            <Textarea {...register("address")} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Notes">
            <Textarea {...register("notes")} />
          </Field>
        </div>
      </div>
      {message ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {message}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button disabled={isSubmitting} className="shadow-sm">
          {isSubmitting ? "Saving…" : "Save driver"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
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
    <div className="space-y-1.5">
      <Label className="text-slate-700">{label}</Label>
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
