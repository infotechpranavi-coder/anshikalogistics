import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  children?: ReactNode;
}

export function PageHeader({
  title,
  description,
  badge,
  children,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-2">
        {badge ? (
          <span className="inline-flex items-center rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-teal-700 ring-1 ring-teal-100">
            {badge}
          </span>
        ) : null}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-[2rem] sm:leading-tight">
            {title}
          </h1>
          {description ? (
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-[15px]">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {children ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>
      ) : null}
    </div>
  );
}
