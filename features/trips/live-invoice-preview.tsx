"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { APP_LOGO } from "@/lib/brand";
import { calculatePendingLt } from "@/utils/calculations";
import { buildUpiQrPayload, generateQrDataUrl } from "@/lib/qrcode";
import type { LiveInvoiceData } from "@/types";

export interface LiveInvoicePreviewProps {
  data: LiveInvoiceData;
}

export function LiveInvoicePreview({ data }: LiveInvoicePreviewProps) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadQr() {
      if (!data.upiId) {
        setQrUrl(null);
        return;
      }
      try {
        const payload = buildUpiQrPayload({
          upiId: data.upiId,
          name: data.companyName,
          amount: data.pendingAmount > 0 ? data.pendingAmount : data.grandTotal,
          note: data.invoiceNumber,
        });
        const url = await generateQrDataUrl(payload, { width: 128 });
        if (!cancelled) setQrUrl(url);
      } catch {
        if (!cancelled) setQrUrl(null);
      }
    }
    void loadQr();
    return () => {
      cancelled = true;
    };
  }, [
    data.upiId,
    data.companyName,
    data.pendingAmount,
    data.grandTotal,
    data.invoiceNumber,
  ]);

  return (
    <article className="invoice-preview mx-auto aspect-[1/1.414] w-full max-w-190 overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-lg print:aspect-auto print:max-w-none print:rounded-none print:border-0 print:shadow-none">
      <div className="flex h-full flex-col p-6 sm:p-8">
        <header className="flex items-start justify-between gap-6 border-b-2 border-slate-800 pb-5">
          <div className="flex items-center gap-4">
            {/* Local brand mark from /public or company settings */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.companyLogo || APP_LOGO}
              alt={`${data.companyName} logo`}
              className="h-16 w-auto max-w-28 rounded-lg object-contain"
            />
            <div>
              <h1 className="text-xl font-bold tracking-tight">{data.companyName}</h1>
              {data.companyAddress && (
                <p className="mt-1 max-w-sm text-xs text-slate-500">{data.companyAddress}</p>
              )}
              <p className="mt-1 text-xs text-slate-500">
                {[data.companyPhone, data.companyEmail].filter(Boolean).join(" · ")}
              </p>
              {data.companyGst && <p className="text-xs text-slate-500">GST: {data.companyGst}</p>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Invoice</p>
            <p className="mt-1 text-lg font-bold">{data.invoiceNumber}</p>
            <p className="text-xs text-slate-500">{formatDate(data.tripDate, "long")}</p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-4 border-b border-slate-200 py-4 text-xs">
          <div>
            <p className="font-semibold uppercase tracking-wide text-slate-400">Vehicle</p>
            <p className="mt-1 text-sm font-semibold">{data.vehicleNumber || "—"}</p>
            <p className="text-slate-500">
              {[data.vehicleType, data.owner].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
          <div>
            <p className="font-semibold uppercase tracking-wide text-slate-400">Driver</p>
            <p className="mt-1 text-sm font-semibold">{data.driverName || "—"}</p>
            <p className="text-slate-500">{data.driverPhone || "—"}</p>
          </div>
        </section>

        <section className="border-b border-slate-200 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Route</p>
          <div className="mt-2 flex items-center gap-3 text-sm font-semibold">
            <span className="min-w-0 flex-1 truncate">{data.source || "Source"}</span>
            <span className="text-slate-400">→</span>
            <span className="min-w-0 flex-1 truncate text-right">{data.destination || "Destination"}</span>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-5 py-4">
          <InvoiceTable
            title="Distance"
            rows={[
              ["Loading KM", `${data.loadingKm.toFixed(2)} km`],
              ["Unloading KM", `${data.unloadingKm.toFixed(2)} km`],
              ["KM", `${data.distance.toFixed(2)} km`],
            ]}
          />
          <InvoiceTable
            title="Fuel"
            rows={[
              ["Lt", `${data.fuelRequired.toFixed(2)} l`],
              ["Paid Lt", `${data.fuelFilled.toFixed(2)} l`],
              ["Pending Lt", `${calculatePendingLt(data.fuelRequired, data.fuelFilled).toFixed(2)} l`],
              ["Desil Amt", formatCurrency(data.fuelCost)],
            ]}
          />
        </div>

        <section className="border-t border-slate-200 pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Charges</p>
          <div className="space-y-1 text-xs">
            <AmountRow label="Desil Amt" value={data.fuelCost} />
            {(data.extraExpenses ?? []).map((item) => (
              <AmountRow key={`${item.title}-${item.amount}`} label={item.title} value={item.amount} />
            ))}
            {data.voucherNumber ? (
              <div className="flex justify-between gap-6">
                <span>Voucher</span>
                <span className="font-medium">{data.voucherNumber}</span>
              </div>
            ) : null}
          </div>
        </section>

        <section className="mt-4 grid grid-cols-[1fr_auto] gap-8 border-t-2 border-slate-800 pt-4">
          <div className="flex items-end gap-4">
            {data.upiId &&
              (qrUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrUrl}
                  alt="UPI payment QR"
                  className="h-16 w-16 rounded border border-slate-200"
                />
              ) : (
                <div className="grid h-16 w-16 place-items-center border-2 border-dashed border-slate-300 text-center text-[10px] font-bold text-slate-500">
                  UPI QR
                </div>
              ))}
            {data.upiId && (
              <p className="pb-1 text-[10px] text-slate-500">Pay to {data.upiId}</p>
            )}
          </div>
          <div className="w-52 space-y-1 text-xs">
            <AmountRow label="Final Amount" value={data.grandTotal} strong />
            <AmountRow label="Paid" value={data.paidAmount} />
            <AmountRow label="Pending" value={data.pendingAmount} strong />
          </div>
        </section>

        <footer className="mt-auto grid grid-cols-2 items-end gap-8 pt-6 text-[10px] text-slate-500">
          <div>
            {data.narration && (
              <p>
                <span className="font-semibold">Narration:</span> {data.narration}
              </p>
            )}
            {data.remarks && (
              <p>
                <span className="font-semibold">Entry:</span> {data.remarks}
              </p>
            )}
            <p className="mt-2">Thank you for your business.</p>
          </div>
          <div className="text-right">
            {data.signature && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.signature}
                alt="Authorized signature"
                className="ml-auto h-10 object-contain"
              />
            )}
            <div className="ml-auto mt-1 w-32 border-t border-slate-400 pt-1">
              Authorized signature
            </div>
          </div>
        </footer>
      </div>
    </article>
  );
}

function InvoiceTable({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <section>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      <div className="overflow-hidden rounded-md border border-slate-200">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex justify-between border-b border-slate-100 px-2 py-1.5 text-[11px] last:border-0"
          >
            <span className="text-slate-500">{label}</span>
            <span className="font-medium">{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function AmountRow({
  label,
  value,
  strong,
  muted,
}: {
  label: string;
  value: number;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={`flex justify-between gap-6 ${strong ? "text-sm font-bold" : ""} ${muted ? "text-slate-400" : ""}`}
    >
      <span>{label}</span>
      <span>{formatCurrency(value)}</span>
    </div>
  );
}

export default LiveInvoicePreview;
