"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Car,
  FileText,
  Gauge,
  Map,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Gauge },
  { name: "Trips", href: "/trips", icon: Map },
  { name: "Vehicles", href: "/vehicles", icon: Car },
  { name: "Drivers", href: "/drivers", icon: Users },
  { name: "Invoices", href: "/invoices", icon: FileText },
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
          "fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white text-slate-900 shadow-xl transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-none",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
            onClick={onClose}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md shadow-teal-600/20">
              <Gauge className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              FleetFuel
            </span>
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close navigation</span>
          </Button>
        </div>

        <ScrollArea className="flex-1 px-3 py-5">
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
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-teal-50 text-teal-800 ring-1 ring-inset ring-teal-100"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      isActive
                        ? "text-teal-700"
                        : "text-slate-400 group-hover:text-slate-600"
                    )}
                    aria-hidden="true"
                  />
                  {name}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="border-t border-slate-200 p-4">
          <div className="rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100">
            <p className="text-xs font-semibold text-slate-800">Fleet operations</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Manage smarter. Drive farther.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
