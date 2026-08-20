"use client";

import { Bell, CheckCheck } from "lucide-react";
import { markAllRead, markAsRead } from "@/actions/notifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export interface NotificationRow {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: Date | string;
}

export function NotificationsList({ data }: { data: NotificationRow[] }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          className="border-slate-200 bg-white shadow-sm"
          onClick={async () => {
            await markAllRead();
            location.reload();
          }}
        >
          <CheckCheck className="h-4 w-4" />
          Mark all read
        </Button>
      </div>
      <div className="space-y-3">
        {data.map((n) => (
          <button
            key={n.id}
            type="button"
            className={`flex w-full gap-4 rounded-[1.15rem] border p-4 text-left shadow-[0_12px_40px_-30px_rgba(15,23,42,0.25)] transition hover:-translate-y-0.5 hover:border-teal-300 ${
              n.isRead
                ? "border-slate-200/80 bg-white"
                : "border-teal-200 bg-gradient-to-r from-teal-50/80 to-white"
            }`}
            onClick={async () => {
              if (!n.isRead) await markAsRead(n.id);
              if (n.link) location.assign(n.link);
              else location.reload();
            }}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
              <Bell className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <strong className="text-slate-900">{n.title}</strong>
                <Badge variant="outline">{n.type.replaceAll("_", " ")}</Badge>
              </span>
              <span className="mt-1 block text-sm leading-relaxed text-slate-600">
                {n.message}
              </span>
              <span className="mt-2 block text-xs text-slate-400">
                {formatDate(n.createdAt, "datetime")}
              </span>
            </span>
          </button>
        ))}
        {!data.length ? (
          <div className="rounded-[1.25rem] border border-dashed border-slate-300/80 bg-white/80 p-12 text-center text-sm text-slate-500">
            You have no notifications.
          </div>
        ) : null}
      </div>
    </div>
  );
}
