import type { ComponentType, ReactNode } from "react";

import { cn } from "@/lib/utils";

export function ModernPanel({
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)]",
        className
      )}
    >
      {title ? (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-teal-50/30 px-5 py-5 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            {Icon ? (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-lg shadow-teal-600/20">
                <Icon className="h-4 w-4" />
              </span>
            ) : null}
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h2>
              {description ? (
                <p className="mt-0.5 text-sm text-slate-500">{description}</p>
              ) : null}
            </div>
          </div>
          {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
        </div>
      ) : null}
      <div className={cn("p-5 sm:p-6", bodyClassName)}>{children}</div>
    </section>
  );
}

export function FormSectionCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "space-y-4 rounded-[1.25rem] border border-slate-100 bg-slate-50/40 p-5 sm:p-6",
        className
      )}
    >
      <div className="border-b border-slate-200/70 pb-4">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-sm text-slate-500">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
