"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LockKeyhole, Mail } from "lucide-react";
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
import { loginSchema, type LoginInput } from "@/schemas";

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    try {
      const result = await signIn("credentials", {
        email: values.email.trim().toLowerCase(),
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        setServerError(
          "Login failed. If this keeps happening on the live site, allow 0.0.0.0/0 in MongoDB Atlas Network Access, then try admin@fleetfuel.com / password123."
        );
        return;
      }

      if (result?.ok === false) {
        setServerError("Unable to sign in. Please try again.");
        return;
      }

      const callbackUrl = new URLSearchParams(window.location.search).get(
        "callbackUrl"
      );
      const destination =
        callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//")
          ? callbackUrl
          : "/dashboard";
      router.push(destination);
      router.refresh();
    } catch {
      setServerError("Unable to sign in right now. Please try again.");
    }
  }

  return (
    <Card className="border-slate-200 bg-white shadow-xl shadow-slate-900/5">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-2xl text-slate-900">Welcome back</CardTitle>
        <CardDescription className="text-slate-600">
          Sign in to manage your fleet and trips
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

          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                className="pl-9"
                aria-invalid={Boolean(errors.email)}
                {...register("email")}
              />
            </div>
            {errors.email ? (
              <p className="text-xs text-red-600">{errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
            </div>
            <div className="relative">
              <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                className="pl-9"
                aria-invalid={Boolean(errors.password)}
                {...register("password")}
              />
            </div>
            {errors.password ? (
              <p className="text-xs text-red-600">{errors.password.message}</p>
            ) : null}
          </div>

          <Button
            type="submit"
            className="w-full bg-teal-600 text-white hover:bg-teal-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" /> Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to Anshika Logistics?{" "}
          <Link
            href="/register"
            className="font-semibold text-teal-700 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
