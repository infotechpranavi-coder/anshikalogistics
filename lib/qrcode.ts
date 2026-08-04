import QRCode from "qrcode";

export async function generateQrDataUrl(
  text: string,
  options?: { width?: number; margin?: number }
): Promise<string> {
  return QRCode.toDataURL(text, {
    width: options?.width ?? 200,
    margin: options?.margin ?? 1,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });
}

export function buildUpiQrPayload(params: {
  upiId: string;
  name: string;
  amount?: number;
  note?: string;
}): string {
  const search = new URLSearchParams({
    pa: params.upiId,
    pn: params.name,
    cu: "INR",
  });
  if (params.amount && params.amount > 0) {
    search.set("am", params.amount.toFixed(2));
  }
  if (params.note) {
    search.set("tn", params.note);
  }
  return `upi://pay?${search.toString()}`;
}
