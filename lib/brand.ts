export const APP_NAME = "Anshika Logistics";
export const APP_DESCRIPTION =
  "Trip, vehicle, and diesel expense management for Anshika Logistics.";
export const APP_LOGO = "/anishka-logistics-logo.jpeg";

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
