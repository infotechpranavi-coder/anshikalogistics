"use client";

import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Building2, Landmark } from "lucide-react";
import { ModernPanel } from "@/components/shared/modern-panel";
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
      <ModernPanel
        title="Invoice letterhead"
        description="These details appear at the top of every invoice preview."
        icon={Building2}
      >
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
      </ModernPanel>

      <ModernPanel
        title="Bank details"
        description="Shown at the bottom of the invoice preview."
        icon={Landmark}
      >
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
      </ModernPanel>

      {message ? (
        <p
          className={
            message.startsWith("Settings saved")
              ? "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              : "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          }
        >
          {message}
        </p>
      ) : null}
      <Button type="submit" disabled={isSubmitting} className="shadow-sm">
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
      <Label className="text-slate-700">{label}</Label>
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
