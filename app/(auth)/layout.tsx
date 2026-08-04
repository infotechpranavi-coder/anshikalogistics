import Link from "next/link";
import { Gauge } from "lucide-react";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-teal-50 px-4 py-12">
      <div
        aria-hidden="true"
        className="absolute -left-32 top-1/4 h-80 w-80 rounded-full bg-teal-200/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -right-32 bottom-1/4 h-80 w-80 rounded-full bg-slate-200/50 blur-3xl"
      />
      <div className="relative z-10 w-full max-w-md">
        <Link
          href="/"
          className="mb-7 flex items-center justify-center gap-3 text-slate-900"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-lg shadow-teal-600/20">
            <Gauge className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-xl font-bold tracking-tight">FleetFuel</span>
        </Link>
        {children}
        <p className="mt-6 text-center text-xs text-slate-500">
          Secure fleet operations management
        </p>
      </div>
    </main>
  );
}
