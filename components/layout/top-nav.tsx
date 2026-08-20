"use client";

import Link from "next/link";
import { Bell, LogOut, Menu, Search } from "lucide-react";
import { signOut } from "next-auth/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopNavProps {
  onMenuClick?: () => void;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

function getInitials(name?: string | null) {
  if (!name) return "U";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function TopNav({ onMenuClick, user }: TopNavProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/80 px-4 shadow-sm backdrop-blur-xl sm:px-6">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-slate-700 hover:bg-slate-100 lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Open navigation</span>
      </Button>

      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event("fleetfuel:command-open"))}
        className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-left text-sm text-slate-500 transition-colors hover:border-slate-300 hover:bg-white sm:max-w-md"
      >
        <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
        <span className="truncate">Search trips, vehicles, drivers...</span>
        <kbd className="ml-auto hidden rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-500 sm:inline-flex">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="relative text-slate-700 hover:bg-slate-100"
        >
          <Link href="/notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-teal-500 ring-2 ring-white" />
            <span className="sr-only">Notifications</span>
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-10 gap-2 px-2 text-slate-800 hover:bg-slate-100"
            >
              <Avatar className="h-8 w-8 ring-2 ring-teal-100">
                <AvatarImage
                  src={user?.image ?? undefined}
                  alt={user?.name ?? "User"}
                />
                <AvatarFallback className="bg-teal-50 font-semibold text-teal-700">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-36 truncate text-sm font-semibold md:inline">
                {user?.name ?? "Account"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 border-slate-200 bg-white text-slate-900"
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {user?.name ?? "Your account"}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
