"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileCheck2, FileText, Route, Save, Sparkles } from "lucide-react";
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
    <div className="mx-auto w-full max-w-[1400px] space-y-5">
      <div className="sticky top-[4.25rem] z-20 -mx-1 rounded-2xl border border-white/70 bg-white/85 px-3 py-3 shadow-[0_10px_40px_-20px_rgba(15,23,42,0.35)] backdrop-blur-xl print:hidden sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl bg-slate-100/90 p-1 ring-1 ring-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveTab("trip")}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                activeTab === "trip"
                  ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Route className="h-4 w-4" />
              Trip
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                activeTab === "preview"
                  ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <FileText className="h-4 w-4" />
              Preview
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy !== null}
              onClick={() => actionsRef.current.draft()}
              className="border-slate-200 bg-white/90 shadow-sm hover:bg-slate-50"
            >
              <Save className="h-4 w-4" />
              {busy === "draft" ? "Saving…" : "Save draft"}
            </Button>
            <Button
              type="button"
              disabled={busy !== null}
              onClick={() => actionsRef.current.save()}
              className="shadow-sm"
            >
              <FileCheck2 className="h-4 w-4" />
              {busy === "save" ? "Saving…" : tripId ? "Update trip" : "Save trip"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={busy !== null}
              onClick={() => actionsRef.current.invoice()}
              className="border border-teal-100 bg-teal-50 text-teal-800 shadow-sm hover:bg-teal-100"
            >
              <Sparkles className="h-4 w-4" />
              {busy === "invoice" ? "Generating…" : "Generate invoice"}
            </Button>
          </div>
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
          "min-h-[calc(100vh-10rem)] overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-gradient-to-b from-slate-100 to-white p-4 shadow-sm sm:p-6 print:min-h-0 print:border-0 print:bg-white print:p-0 print:shadow-none"
        )}
      >
        {liveData ? (
          <LiveInvoicePreview data={liveData} fullScreen />
        ) : (
          <div className="grid min-h-[70vh] place-items-center rounded-2xl border border-dashed border-slate-300/80 bg-white/80 px-6 text-center text-sm text-slate-500">
            Fill the trip form first to see the invoice preview.
          </div>
        )}
      </section>
    </div>
  );
}

export default TripFormPage;
