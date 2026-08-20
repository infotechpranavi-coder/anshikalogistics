"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Car,
  ChevronRight,
  FileText,
  Gauge,
  Map,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import { BrandLogo } from "@/components/shared/brand-logo";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Gauge },
  { name: "Trips", href: "/trips", icon: Map },
  { name: "Vehicles", href: "/vehicles", icon: Car },
  { name: "Drivers", href: "/drivers", icon: Users },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
] as const;

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <button
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[17.5rem] flex-col border-r border-white/10 bg-gradient-to-b from-slate-950 via-slate-900 to-teal-950 text-white shadow-2xl transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-none",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="relative flex h-[4.75rem] items-center justify-between px-5">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <Link
            href="/dashboard"
            className="flex min-w-0 items-center gap-3 rounded-xl px-1 py-1 transition-opacity hover:opacity-90"
            onClick={onClose}
          >
            <div className="rounded-xl bg-white/95 p-1.5 shadow-lg ring-1 ring-white/20">
              <BrandLogo imgClassName="h-9 max-w-[7rem]" />
            </div>
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close navigation</span>
          </Button>
        </div>

        <ScrollArea className="flex-1 px-3 py-6">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
            Main menu
          </p>
          <nav aria-label="Main navigation" className="space-y-1">
            {navigation.map(({ name, href, icon: Icon }) => {
              const isActive =
                pathname === href ||
                (href !== "/dashboard" && pathname.startsWith(`${href}/`));

              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-white/12 text-white shadow-sm ring-1 ring-inset ring-white/10"
                      : "text-white/65 hover:bg-white/8 hover:text-white"
                  )}
                >
                  {isActive ? (
                    <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-teal-400" />
                  ) : null}
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                      isActive
                        ? "bg-teal-500/20 text-teal-200"
                        : "bg-white/5 text-white/55 group-hover:bg-white/10 group-hover:text-white/85"
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                  <span className="flex-1">{name}</span>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 shrink-0 transition-all",
                      isActive
                        ? "text-teal-200/80 opacity-100"
                        : "text-white/25 opacity-0 group-hover:opacity-100"
                    )}
                    aria-hidden="true"
                  />
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="relative p-4">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500/20 via-white/10 to-white/5 p-4 ring-1 ring-white/10">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-400/20 text-teal-200">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">Fleet operations</p>
                <p className="mt-1 text-xs leading-relaxed text-white/60">
                  Manage smarter. Drive farther.
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
