"use client";

import { useState, type ReactNode } from "react";

import { CommandMenu } from "@/components/layout/command-menu";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";

export function DashboardShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="min-w-0 flex-1">
        <TopNav onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 text-slate-900 sm:p-6 lg:p-8">{children}</main>
      </div>
      <CommandMenu />
    </div>
  );
}
