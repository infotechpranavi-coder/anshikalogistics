"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Car,
  FileText,
  Gauge,
  Map,
  Search,
  Users,
} from "lucide-react";

const destinations = [
  { label: "Dashboard", href: "/dashboard", icon: Gauge },
  { label: "Trips", href: "/trips", icon: Map },
  { label: "Vehicles", href: "/vehicles", icon: Car },
  { label: "Drivers", href: "/drivers", icon: Users },
  { label: "Invoices", href: "/invoices", icon: FileText },
] as const;

export function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((current) => !current), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key?.toLowerCase?.();
      if (key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggle();
      }
    };
    const onOpen = () => setOpen(true);

    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("fleetfuel:command-open", onOpen);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("fleetfuel:command-open", onOpen);
    };
  }, [toggle]);

  const navigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global navigation"
      overlayClassName="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm"
      contentClassName="fixed left-1/2 top-[18%] z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-2xl"
    >
      <div className="flex items-center border-b px-4" cmdk-input-wrapper="">
        <Search className="mr-3 h-4 w-4 shrink-0 text-muted-foreground" />
        <Command.Input
          autoFocus
          placeholder="Search pages and navigation..."
          className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          ESC
        </kbd>
      </div>
      <Command.List className="max-h-80 overflow-y-auto p-2">
        <Command.Empty className="py-10 text-center text-sm text-muted-foreground">
          No results found.
        </Command.Empty>
        <Command.Group
          heading="Navigate"
          className="text-xs font-medium text-muted-foreground **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-2"
        >
          {destinations.map(({ label, href, icon: Icon }) => (
            <Command.Item
              key={href}
              value={`${label} ${href}`}
              onSelect={() => navigate(href)}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none data-[selected=true]:bg-accent"
            >
              <Icon className="h-4 w-4 text-teal-600" aria-hidden="true" />
              <span>{label}</span>
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
      <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground">
        <span>Use ↑↓ to navigate</span>
        <span>Enter to open</span>
      </div>
    </Command.Dialog>
  );
}
