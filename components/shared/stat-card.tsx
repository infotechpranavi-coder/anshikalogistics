import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
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
    <Card className={cn("overflow-hidden border-slate-200 bg-white shadow-sm", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <p className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-900">
              {value}
            </p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700 ring-1 ring-teal-100">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>
        {(description || trend) && (
          <div className="mt-4 flex items-center gap-2 text-xs">
            {trend ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 font-semibold",
                  trend.isPositive ? "text-emerald-600" : "text-rose-600"
                )}
              >
                <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {Math.abs(trend.value)}%
              </span>
            ) : null}
            {description ? (
              <span className="text-slate-500">{description}</span>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
