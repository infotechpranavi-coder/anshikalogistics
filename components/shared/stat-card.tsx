import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  const TrendIcon = trend?.isPositive ? TrendingUp : TrendingDown;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[1.25rem] border border-slate-200/80 bg-white p-5 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)] transition-transform duration-200 hover:-translate-y-0.5",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-400 opacity-80" />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-950">
            {value}
          </p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 ring-1 ring-teal-100 transition-colors group-hover:bg-teal-100">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      {(description || trend) && (
        <div className="mt-4 flex items-center gap-2 text-xs">
          {trend ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold",
                trend.isPositive
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              )}
            >
              <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {Math.abs(trend.value)}%
            </span>
          ) : null}
          {description ? <span className="text-slate-500">{description}</span> : null}
        </div>
      )}
    </div>
  );
}
