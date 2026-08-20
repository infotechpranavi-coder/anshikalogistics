"use client";

import { useState, type ReactNode } from "react";

import { CommandMenu } from "@/components/layout/command-menu";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";

export function DashboardShell({
  children,
  user,
}: {
  children: ReactNode;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#eef2f7] text-slate-900">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(13,148,136,0.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(15,23,42,0.05),transparent_24%)]" />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="min-w-0 flex-1">
        <TopNav user={user} onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
      <CommandMenu />
    </div>
  );
}
