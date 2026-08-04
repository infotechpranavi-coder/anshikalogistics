"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  Loader2,
  LockKeyhole,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerSchema, type RegisterInput } from "@/schemas";

const fields = [
  {
    name: "name",
    label: "Your name",
    type: "text",
    autoComplete: "name",
    placeholder: "Alex Morgan",
    icon: User,
  },
  {
    name: "companyName",
    label: "Company name",
    type: "text",
    autoComplete: "organization",
    placeholder: "Acme Logistics",
    icon: Building2,
  },
  {
    name: "email",
    label: "Email address",
    type: "email",
    autoComplete: "email",
    placeholder: "you@company.com",
    icon: Mail,
  },
  {
    name: "phone",
    label: "Phone (optional)",
    type: "tel",
    autoComplete: "tel",
    placeholder: "+91 98765 43210",
    icon: Phone,
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    autoComplete: "new-password",
    placeholder: "At least 6 characters",
    icon: LockKeyhole,
  },
  {
    name: "confirmPassword",
    label: "Confirm password",
    type: "password",
    autoComplete: "new-password",
    placeholder: "Repeat your password",
    icon: LockKeyhole,
  },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      companyName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: RegisterInput) {
    setServerError(null);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setServerError(payload.error ?? "Unable to create your account.");
      return;
    }

    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (result?.error) {
      router.push("/login");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="border-slate-200 bg-white shadow-xl shadow-slate-900/5">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-2xl">Create your workspace</CardTitle>
        <CardDescription>
          Set up your company and administrator account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {serverError ? (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {serverError}
            </div>
          ) : null}

          {fields.map(({ name, label, icon: Icon, ...field }) => (
            <div key={name} className="space-y-2">
              <Label htmlFor={name}>{label}</Label>
              <div className="relative">
                <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id={name}
                  className="pl-9"
                  aria-invalid={Boolean(errors[name])}
                  {...field}
                  {...register(name)}
                />
              </div>
              {errors[name] ? (
                <p className="text-xs text-red-600">{errors[name]?.message}</p>
              ) : null}
            </div>
          ))}

          <Button
            type="submit"
            className="w-full bg-teal-600 text-white hover:bg-teal-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" /> Creating workspace...
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-teal-700 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
