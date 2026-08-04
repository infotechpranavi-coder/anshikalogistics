import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[88px] w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus-visible:border-teal-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
