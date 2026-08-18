"use client";

import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { companySettingsSchema, type CompanySettingsInput } from "@/schemas";
import type { ActionResult } from "@/types";

export function SettingsForm({
  initial,
  onSubmit,
}: {
  initial: CompanySettingsInput;
  onSubmit: (data: CompanySettingsInput) => Promise<ActionResult<{ id: string }>>;
}) {
  const [message, setMessage] = useState("");
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<CompanySettingsInput>({ defaultValues: initial });

  const save = handleSubmit(async (values) => {
    setMessage("");
    const parsed = companySettingsSchema.safeParse(values);
    if (!parsed.success) {
      setMessage("Please correct the company details.");
      return;
    }
    const result = await onSubmit(parsed.data);
    setMessage(
      result.success
        ? "Settings saved. Invoice preview will use these details."
        : result.error ?? "Unable to save settings."
    );
  });

  return (
    <form onSubmit={save} className="space-y-6">
      <section className="space-y-4 rounded-xl border bg-white p-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Invoice letterhead</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            These details appear at the top of every invoice preview.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company name" error={errors.name?.message}>
            <Input {...register("name")} />
          </Field>
          <Field label="GST number" error={errors.gst?.message}>
            <Input {...register("gst")} placeholder="27GUOPD3977F1Z5" />
          </Field>
          <Field label="Phone number" error={errors.phone?.message}>
            <Input {...register("phone")} placeholder="8452823542" />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" {...register("email")} placeholder="anshikalogistics7@gmail.com" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Address" error={errors.address?.message}>
              <Textarea
                rows={3}
                {...register("address")}
                placeholder="Fl.No- 07, Blgd no A/5 GR Floor, Shree Datta Nagari Complex, Pipeline Road, Purna, Bhiwandi- 421302"
              />
            </Field>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border bg-white p-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Bank details</h2>
          <p className="mt-0.5 text-sm text-slate-500">Shown at the bottom of the invoice preview.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Bank Name" error={errors.bankName?.message}>
            <Input {...register("bankName")} placeholder="YES BANK" />
          </Field>
          <Field label="Bank IFSC Code" error={errors.bankIfsc?.message}>
            <Input {...register("bankIfsc")} placeholder="YESB0000077" />
          </Field>
          <Field label="Bank A/c No" error={errors.bankAccount?.message}>
            <Input {...register("bankAccount")} placeholder="007763200001514" />
          </Field>
          <Field label="Bank Branch" error={errors.bankBranch?.message}>
            <Input {...register("bankBranch")} placeholder="THANE TALAV PALI" />
          </Field>
          <Field label="UPI ID" error={errors.upiId?.message}>
            <Input {...register("upiId")} />
          </Field>
        </div>
      </section>

      {message ? (
        <p className={message.startsWith("Settings saved") ? "text-emerald-700" : "text-red-700"}>
          {message}
        </p>
      ) : null}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save settings"}
      </Button>
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
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
