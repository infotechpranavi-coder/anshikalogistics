import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center rounded-[1.35rem] border border-dashed border-slate-300/80 bg-white/80 px-6 py-14 text-center shadow-[0_18px_50px_-30px_rgba(15,23,42,0.2)]">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 text-teal-700 ring-1 ring-teal-100">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </div>
      <h3 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
