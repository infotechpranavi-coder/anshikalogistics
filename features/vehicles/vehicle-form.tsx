"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
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
import { vehicleSchema, type VehicleInput } from "@/schemas";
import type { VehicleRow } from "@/features/vehicles/vehicles-table";
import type { ActionResult } from "@/types";

type FormValues = Pick<VehicleInput, "number" | "type" | "fuelType" | "status" | "currentDriverId">;

const defaultFormValues: FormValues = {
  number: "",
  type: "Truck",
  fuelType: "DIESEL",
  status: "ACTIVE",
  currentDriverId: null,
};

export function VehicleForm({
  initial,
  drivers = [],
  embedded = false,
  onSubmit,
  onCreated,
  onCancel,
}: {
  initial?: Partial<VehicleInput> & { id?: string };
  drivers?: { id: string; name: string }[];
  embedded?: boolean;
  onSubmit: (data: VehicleInput) => Promise<ActionResult<{ id: string }>>;
  onCreated?: (vehicle: VehicleRow) => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      number: initial?.number ?? defaultFormValues.number,
      type: initial?.type || defaultFormValues.type,
      fuelType: initial?.fuelType ?? defaultFormValues.fuelType,
      status: initial?.status ?? defaultFormValues.status,
      currentDriverId: initial?.currentDriverId ?? defaultFormValues.currentDriverId,
    },
  });

  const submit = handleSubmit(async (values) => {
    setMessage("");
    const parsed = vehicleSchema.safeParse({
      ...initial,
      ...values,
      type: values.type.trim() || "Truck",
    });
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0];
        if (typeof key === "string" && key in values) {
          setError(key as keyof FormValues, { message: issue.message });
        }
      });
      return;
    }
    const result = await onSubmit(parsed.data);
    if (!result.success || !result.data) {
      setMessage(result.error ?? "Unable to save vehicle.");
      return;
    }
    if (embedded && onCreated) {
      if ("number" in result.data) {
        onCreated(result.data as VehicleRow);
      }
      reset(defaultFormValues);
      return;
    }
    router.push(`/vehicles/${result.data.id}`);
    router.refresh();
  });

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Vehicle number" error={errors.number?.message}>
          <Input {...register("number")} placeholder="e.g. 3262" />
        </Field>
        <Field label="Vehicle type" error={errors.type?.message}>
          <Input {...register("type")} placeholder="Truck" />
        </Field>
        <Field label="Fuel type">
          <Controller
            control={control}
            name="fuelType"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["DIESEL", "PETROL", "CNG", "ELECTRIC", "HYBRID"].map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field label="Status">
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["ACTIVE", "MAINTENANCE", "INACTIVE", "SOLD"].map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Current driver">
            <Controller
              control={control}
              name="currentDriverId"
              render={({ field }) => (
                <Select
                  value={field.value ?? "NONE"}
                  onValueChange={(value) => field.onChange(value === "NONE" ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Unassigned</SelectItem>
                    {drivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>
      </div>
      {message ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{message}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : embedded ? "Add vehicle" : "Save vehicle"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (onCancel) {
              onCancel();
              return;
            }
            if (embedded) {
              reset(defaultFormValues);
              return;
            }
            router.back();
          }}
        >
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
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
