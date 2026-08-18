"use client";

import { useCallback, useState } from "react";
import { FileText, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LiveInvoiceData } from "@/types";
import { LiveInvoicePreview } from "./live-invoice-preview";
import { TripEntryForm, type TripEntryFormProps } from "./trip-entry-form";

export type TripFormPageProps = Omit<TripEntryFormProps, "onChangeLiveData">;

export function TripFormPage(props: TripFormPageProps) {
  const [liveData, setLiveData] = useState<LiveInvoiceData | null>(null);
  const [activeTab, setActiveTab] = useState<"trip" | "preview">("trip");
  const handleLiveData = useCallback((data: LiveInvoiceData) => setLiveData(data), []);

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1 print:hidden">
        <Button
          type="button"
          variant={activeTab === "trip" ? "default" : "ghost"}
          onClick={() => setActiveTab("trip")}
        >
          <Route className="h-4 w-4" />
          Trip
        </Button>
        <Button
          type="button"
          variant={activeTab === "preview" ? "default" : "ghost"}
          onClick={() => setActiveTab("preview")}
        >
          <FileText className="h-4 w-4" />
          Preview
        </Button>
      </div>

      <section className={cn(activeTab !== "trip" && "hidden", "print:hidden")}>
        <TripEntryForm {...props} onChangeLiveData={handleLiveData} />
      </section>

      <section
        className={cn(
          activeTab !== "preview" && "hidden print:block",
          "min-h-[calc(100vh-10rem)] rounded-2xl bg-slate-100 p-4 sm:p-6 print:min-h-0 print:bg-white print:p-0"
        )}
      >
        {liveData ? (
          <LiveInvoicePreview data={liveData} fullScreen />
        ) : (
          <div className="grid min-h-[70vh] place-items-center rounded-xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">
            Fill the trip form first to see the invoice preview.
          </div>
        )}
      </section>
    </div>
  );
}

export default TripFormPage;
