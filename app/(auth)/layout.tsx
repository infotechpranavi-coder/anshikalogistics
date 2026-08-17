import Link from "next/link";
import { BrandLogo } from "@/components/shared/brand-logo";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-slate-50 via-white to-teal-50 px-4 py-12">
      <div
        aria-hidden="true"
        className="absolute -left-32 top-1/4 h-80 w-80 rounded-full bg-teal-200/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -right-32 bottom-1/4 h-80 w-80 rounded-full bg-slate-200/50 blur-3xl"
      />
      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="mb-7 flex items-center justify-center">
          <BrandLogo imgClassName="h-24 max-w-[16rem]" />
        </Link>
        {children}
        <p className="mt-6 text-center text-xs text-slate-500">
          Trip, vehicle, and diesel expense management
        </p>
      </div>
    </main>
  );
}
