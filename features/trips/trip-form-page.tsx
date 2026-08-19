"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileCheck2, FileText, Route, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadInvoicePdf } from "@/features/invoices/download-invoice";
import { cn } from "@/lib/utils";
import type { LiveInvoiceData } from "@/types";
import { LiveInvoicePreview } from "./live-invoice-preview";
import { TripEntryForm, type TripEntryFormProps } from "./trip-entry-form";

export type TripFormPageProps = Omit<
  TripEntryFormProps,
  "onChangeLiveData" | "onRegisterActions" | "onInvoiceGenerated" | "onBusyChange"
> & {
  initialTab?: "trip" | "preview";
};

export function TripFormPage({ initialTab = "trip", tripId, ...props }: TripFormPageProps) {
  const router = useRouter();
  const [liveData, setLiveData] = useState<LiveInvoiceData | null>(null);
  const [activeTab, setActiveTab] = useState<"trip" | "preview">(initialTab);
  const [busy, setBusy] = useState<string | null>(null);
  const liveDataRef = useRef<LiveInvoiceData | null>(null);
  const actionsRef = useRef({
    draft: () => {},
    save: () => {},
    invoice: () => {},
  });
  const handleLiveData = useCallback((data: LiveInvoiceData) => {
    liveDataRef.current = data;
    setLiveData(data);
  }, []);
  const handleRegisterActions = useCallback(
    (actions: { draft: () => void; save: () => void; invoice: () => void }) => {
      actionsRef.current = actions;
    },
    []
  );

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="grid min-w-[240px] grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1 sm:w-[280px]">
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
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy !== null}
            onClick={() => actionsRef.current.draft()}
          >
            <Save className="h-4 w-4" />
            {busy === "draft" ? "Saving…" : "Save draft"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy !== null}
            onClick={() => actionsRef.current.save()}
          >
            <FileCheck2 className="h-4 w-4" />
            {busy === "save" ? "Saving…" : tripId ? "Update trip" : "Save trip"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy !== null}
            onClick={() => actionsRef.current.invoice()}
          >
            <FileText className="h-4 w-4" />
            {busy === "invoice" ? "Generating…" : "Generate invoice"}
          </Button>
        </div>
      </div>

      <section className={cn(activeTab !== "trip" && "hidden", "print:hidden")}>
        <TripEntryForm
          {...props}
          tripId={tripId}
          onChangeLiveData={handleLiveData}
          onRegisterActions={handleRegisterActions}
          onBusyChange={setBusy}
          onInvoiceGenerated={(info) => {
            const next = liveDataRef.current
              ? { ...liveDataRef.current, invoiceNumber: info.invoiceNumber }
              : null;
            if (next) {
              liveDataRef.current = next;
              setLiveData(next);
              void downloadInvoicePdf(next).catch((error) => {
                console.error(error);
                toast.error("Invoice was generated, but the PDF download failed.");
              });
            }
            setActiveTab("preview");
            if (info.tripId && info.tripId !== tripId) {
              router.replace(`/trips/${info.tripId}?preview=1`);
            }
          }}
        />
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
