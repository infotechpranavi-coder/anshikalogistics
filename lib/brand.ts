export const APP_NAME = "Anshika Logistics";
export const APP_DESCRIPTION =
  "Trip, vehicle, and diesel expense management for Anshika Logistics.";
export const APP_LOGO = "/anishka-logistics-logo.jpeg";

export const INVOICE_LETTERHEAD = {
  name: "ANSHIKA LOGISTICS",
  jurisdiction: "Subject to Navi Mumbai Jurisdiction Only",
  address:
    "Fl.No- 07, Blgd no A/5 GR FLoor, Shree Datta Nagari Complex, Pipeline Road, Purna, Bhiwandi- 421302",
  phone: "8452823542",
  email: "anshikalogistics7@gmail.com",
  gst: "27GUOPD3977F1Z5",
} as const;

export function resolveLogoUrl(logo?: string | null) {
  const src = logo?.trim() || APP_LOGO;
  if (
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("data:")
  ) {
    return src;
  }
  const path = src.startsWith("/") ? src : `/${src}`;
  if (typeof window !== "undefined") {
    return `${window.location.origin}${path}`;
  }
  return path;
}
