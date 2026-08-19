"use client";

import { createElement } from "react";
import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import { InvoicePdfDocument } from "@/features/invoices/invoice-pdf";
import { APP_LOGO, resolveLogoUrl } from "@/lib/brand";
import { buildUpiQrPayload, generateQrDataUrl } from "@/lib/qrcode";
import type { LiveInvoiceData } from "@/types";

function fileName(invoiceNumber: string) {
  const safe = (invoiceNumber || "invoice").replace(/[\\/:*?"<>|]+/g, "-");
  return `${safe}.pdf`;
}

async function toDataUrl(src?: string | null) {
  if (!src) return null;
  if (src.startsWith("data:")) return src;
  const url = resolveLogoUrl(src);
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

const inFlight = new Set<string>();

export async function downloadInvoicePdf(data: LiveInvoiceData) {
  const key = fileName(data.invoiceNumber);
  if (inFlight.has(key)) return;
  inFlight.add(key);

  try {
    let qrUrl: string | null = null;
    if (data.upiId) {
      try {
        qrUrl = await generateQrDataUrl(
          buildUpiQrPayload({
            upiId: data.upiId,
            name: data.companyName,
            amount: data.grandTotal,
            note: data.invoiceNumber,
          }),
          { width: 160 }
        );
      } catch {
        qrUrl = null;
      }
    }

    const [logo, signature] = await Promise.all([
      toDataUrl(data.companyLogo || APP_LOGO),
      toDataUrl(data.signature),
    ]);

    const blob = await pdf(
      createElement(InvoicePdfDocument, {
        data: {
          ...data,
          companyLogo: logo,
          signature,
        },
        qrUrl,
      }) as Parameters<typeof pdf>[0]
    ).toBlob();
    saveAs(blob, key);
  } finally {
    window.setTimeout(() => inFlight.delete(key), 1500);
  }
}
