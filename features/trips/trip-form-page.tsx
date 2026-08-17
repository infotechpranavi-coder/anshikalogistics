"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LiveInvoiceData } from "@/types";
import { LiveInvoicePreview } from "./live-invoice-preview";
import { TripEntryForm, type TripEntryFormProps } from "./trip-entry-form";

export type TripFormPageProps = Omit<TripEntryFormProps, "onChangeLiveData">;

export function TripFormPage(props: TripFormPageProps) {
  const [liveData, setLiveData] = useState<LiveInvoiceData | null>(null);
  const [activeTab, setActiveTab] = useState<"form" | "preview">("form");
  const handleLiveData = useCallback((data: LiveInvoiceData) => setLiveData(data), []);

  return (
    <div className="mx-auto w-full max-w-[1600px]">
      <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1 lg:hidden print:hidden">
        <Button
          type="button"
          variant={activeTab === "form" ? "default" : "ghost"}
          onClick={() => setActiveTab("form")}
        >
          Form
        </Button>
        <Button
          type="button"
          variant={activeTab === "preview" ? "default" : "ghost"}
          onClick={() => setActiveTab("preview")}
        >
          Preview
        </Button>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)]">
        <section
          className={cn(
            "max-h-[calc(100vh-2rem)] overflow-y-auto pr-1 print:hidden",
            activeTab !== "form" && "hidden lg:block"
          )}
        >
          <TripEntryForm {...props} onChangeLiveData={handleLiveData} />
        </section>

        <aside
          className={cn(
            "lg:sticky lg:top-4 print:static print:block",
            activeTab !== "preview" && "hidden lg:block"
          )}
        >
          {liveData ? (
            <LiveInvoicePreview data={liveData} />
          ) : (
            <div className="grid aspect-[1/1.414] place-items-center rounded-xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">
              Preparing invoice preview…
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default TripFormPage;
