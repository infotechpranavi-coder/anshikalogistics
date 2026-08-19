"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  amountInIndianWords,
  formatBillDate,
  formatCurrency,
  formatNumber,
} from "@/lib/utils";
import { APP_LOGO, INVOICE_LETTERHEAD } from "@/lib/brand";
import { calculateAcLitres } from "@/utils/calculations";
import { buildUpiQrPayload, generateQrDataUrl } from "@/lib/qrcode";
import type { LiveInvoiceData } from "@/types";

export interface LiveInvoicePreviewProps {
  data: LiveInvoiceData;
  fullScreen?: boolean;
}

function money(value: number, always = false) {
  if (!always && !value) return "";
  return formatNumber(value);
}

function Cell({
  children,
  right,
  strong,
}: {
  children: ReactNode;
  right?: boolean;
  strong?: boolean;
}) {
  return (
    <td
      className={`border border-neutral-400 px-1 py-2 ${right ? "text-right" : "text-center"} ${strong ? "font-semibold" : ""}`}
    >
      {children}
    </td>
  );
}

export function LiveInvoicePreview({ data, fullScreen = false }: LiveInvoicePreviewProps) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const extras = (data.extraExpenses ?? []).filter((item) => item.title.trim());
  const acLitres = calculateAcLitres(data.acHours ?? 0, data.acLitresPerHour);
  const hasAc = (data.acHours ?? 0) > 0 || (data.acCharge ?? 0) !== 0;
  const entry = Number.isFinite(Number(data.remarks)) ? Number(data.remarks) : 0;
  const dieselAmt = data.fuelCost;
  const extraTotal = extras.reduce((sum, item) => sum + item.amount, 0);
  const acCharge = data.acCharge ?? 0;
  const subTotal = dieselAmt + acCharge + extraTotal;
  const totalFreight = data.grandTotal;
  const billTo = data.owner?.trim() || data.driverName || "—";
  const lrNo = data.tripNumber || data.invoiceNumber;
  const temp = data.isEmpty ? "Empty" : "Loaded";

  const headers = [
    "Sr No.",
    "LR No",
    "Lr Date",
    "Truck No",
    "From City",
    "To City",
    "Type",
    "KM",
    "Lt",
    ...(hasAc ? ["AC Lt"] : []),
    "Entry",
    "Desil Amt",
    ...(hasAc ? ["AC Charge"] : []),
    ...extras.map((item) => item.title),
    "Sub Total",
    "Total Freight",
  ];

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
          amount: data.grandTotal,
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
  }, [data.upiId, data.companyName, data.grandTotal, data.invoiceNumber]);

  return (
    <article
      className={
        fullScreen
          ? "invoice-preview mx-auto w-full max-w-[1100px] overflow-x-auto bg-white text-black shadow-lg print:max-w-none print:shadow-none"
          : "invoice-preview mx-auto w-full max-w-190 overflow-x-auto bg-white text-black shadow-lg print:max-w-none print:shadow-none"
      }
    >
      <div className="border border-black p-3 sm:p-4">
        <p className="text-center text-[11px] font-medium">
          {INVOICE_LETTERHEAD.jurisdiction}
        </p>

        <header className="mt-1 grid grid-cols-[80px_1fr_80px] items-center sm:grid-cols-[96px_1fr_96px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.companyLogo || APP_LOGO}
            alt={`${data.companyName || INVOICE_LETTERHEAD.name} logo`}
            className="h-16 w-20 justify-self-start object-contain sm:h-20 sm:w-24"
          />
          <div className="text-center">
            <h1 className="font-serif text-2xl font-bold uppercase tracking-wide text-[#b45309] sm:text-4xl">
              {data.companyName || INVOICE_LETTERHEAD.name}
            </h1>
            <p className="mt-1 text-[11px] leading-4">
              {data.companyAddress || INVOICE_LETTERHEAD.address}
            </p>
            <p className="text-[11px] leading-4">
              {data.companyPhone || data.companyEmail ? (
                <>
                  {data.companyPhone ? `Mob : ${data.companyPhone}` : null}
                  {data.companyPhone && data.companyEmail ? "  " : null}
                  {data.companyEmail ? `Email : ${data.companyEmail}` : null}
                </>
              ) : (
                <>
                  Mob : {INVOICE_LETTERHEAD.phone} Email : {INVOICE_LETTERHEAD.email}
                </>
              )}
            </p>
            {(data.companyGst || INVOICE_LETTERHEAD.gst) ? (
              <p className="text-[11px] font-semibold">
                GSTNO. : {data.companyGst || INVOICE_LETTERHEAD.gst}
              </p>
            ) : null}
          </div>
          <div />
        </header>

        <div className="relative mt-3 border border-neutral-400 py-1 text-center">
          <p className="text-base font-bold">Invoice</p>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold">
            Original
          </span>
        </div>

        <section className="mt-0 grid grid-cols-1 border-x border-b border-neutral-400 text-[11px] sm:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-1 p-3">
            <p className="font-semibold">To,</p>
            <p className="text-sm font-bold uppercase">{billTo}</p>
            {data.driverPhone ? <p>M : {data.driverPhone}</p> : null}
            {data.vehicleType ? <p>{data.vehicleType}</p> : null}
          </div>
          <div className="border-t border-neutral-400 p-3 sm:border-l sm:border-t-0">
            <div className="space-y-1 font-semibold">
              <p>BILL NO : {data.invoiceNumber}</p>
              <p>BILL DATE : {formatBillDate(data.tripDate)}</p>
              <p>HSN Code : 996511</p>
            </div>
          </div>
        </section>

        <div className="overflow-x-auto">
          <table className="w-full min-w-max border-collapse border border-neutral-400 text-[10px]">
            <thead>
              <tr className="bg-neutral-200 text-center font-semibold">
                {headers.map((heading) => (
                  <th key={heading} className="whitespace-nowrap border border-neutral-400 px-1.5 py-1.5">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="align-top">
                <Cell>1</Cell>
                <Cell>{lrNo}</Cell>
                <Cell>{formatBillDate(data.tripDate)}</Cell>
                <Cell strong>{data.vehicleNumber || "—"}</Cell>
                <Cell>{data.source || "—"}</Cell>
                <Cell>{data.destination || "—"}</Cell>
                <Cell>{temp}</Cell>
                <Cell>{formatNumber(data.distance)}</Cell>
                <Cell>{formatNumber(data.fuelRequired)}</Cell>
                {hasAc ? <Cell>{formatNumber(acLitres)}</Cell> : null}
                <Cell right>{money(entry, true)}</Cell>
                <Cell right>{money(dieselAmt, true)}</Cell>
                {hasAc ? <Cell right>{money(acCharge, true)}</Cell> : null}
                {extras.map((item) => (
                  <Cell key={`${item.title}-${item.amount}`} right>
                    {money(item.amount, true)}
                  </Cell>
                ))}
                <Cell right strong>
                  {money(subTotal, true)}
                </Cell>
                <Cell right strong>
                  {money(totalFreight, true)}
                </Cell>
              </tr>
              {Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  {headers.map((heading) => (
                    <td key={heading} className="h-6 border border-neutral-400" />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="grid grid-cols-1 border-x border-b border-neutral-400 text-[11px] sm:grid-cols-[1.4fr_0.9fr]">
          <div className="p-3">
            <p>
              <span className="font-bold">Total Amount In Words :</span>{" "}
              {amountInIndianWords(totalFreight)}
            </p>
          </div>
          <div className="border-t border-neutral-400 sm:border-l sm:border-t-0">
            <div className="flex justify-between border-b border-neutral-400 px-3 py-1.5">
              <span className="font-semibold">Sub Total</span>
              <span>{formatCurrency(subTotal)}</span>
            </div>
            <div className="h-6 border-b border-neutral-400" />
            <div className="flex justify-between bg-neutral-200 px-3 py-1.5 font-bold">
              <span>Total Amount</span>
              <span>{formatCurrency(totalFreight)}</span>
            </div>
          </div>
        </section>

        <section className="mt-0 grid grid-cols-1 gap-4 border-x border-b border-neutral-400 p-3 text-[11px] sm:grid-cols-[1.3fr_0.9fr]">
          <div>
            <div className="border border-neutral-400">
              <div className="grid grid-cols-[120px_1fr] border-b border-neutral-400">
                <p className="border-r border-neutral-400 px-2 py-1 font-bold text-[#b45309]">
                  Bank Name :
                </p>
                <p className="px-2 py-1 font-semibold">{data.bankName || "—"}</p>
              </div>
              <div className="grid grid-cols-[120px_1fr] border-b border-neutral-400">
                <p className="border-r border-neutral-400 px-2 py-1 font-bold text-[#b45309]">
                  Bank IFSC Code :
                </p>
                <p className="px-2 py-1 font-semibold">{data.bankIfsc || "—"}</p>
              </div>
              <div className="grid grid-cols-[120px_1fr] border-b border-neutral-400">
                <p className="border-r border-neutral-400 px-2 py-1 font-bold text-[#b45309]">
                  Bank A/c No:
                </p>
                <p className="px-2 py-1 font-semibold">{data.bankAccount || "—"}</p>
              </div>
              <div className="grid grid-cols-[120px_1fr]">
                <p className="border-r border-neutral-400 px-2 py-1 font-bold text-[#b45309]">
                  Bank Branch :
                </p>
                <p className="px-2 py-1 font-semibold">{data.bankBranch || "—"}</p>
              </div>
            </div>
            <div className="mt-3">
              <p className="font-bold underline">Terms &amp; Condition</p>
              <p>1. Difference if any may be notified within 5 days of receipt.</p>
              <p>2. Please pay your bill amount within 15 days of receipt.</p>
            </div>
          </div>

          <div className="flex flex-col items-end justify-between text-right">
            {qrUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrUrl} alt="UPI QR" className="h-20 w-20 border border-neutral-400" />
            ) : data.upiId ? (
              <div className="grid h-20 w-20 place-items-center border border-dashed border-neutral-400 text-[10px] font-semibold text-neutral-500">
                UPI QR
              </div>
            ) : (
              <div />
            )}
            <div className="mt-4">
              <p className="font-serif font-bold text-[#b45309]">
                For - {data.companyName || INVOICE_LETTERHEAD.name}
              </p>
              {data.signature ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.signature}
                  alt="Authorised signatory"
                  className="ml-auto mt-2 h-10 object-contain"
                />
              ) : (
                <div className="mt-8" />
              )}
              <p className="mt-2 text-[11px]">Authorised Signatory</p>
            </div>
          </div>
        </section>
      </div>
    </article>
  );
}

export default LiveInvoicePreview;
