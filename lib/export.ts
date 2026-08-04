export type CsvValue = string | number | boolean | Date | null | undefined;

const escapeCell = (value: CsvValue) => {
  const text = value instanceof Date ? value.toISOString() : value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
};

export function rowsToCsv(rows: Record<string, CsvValue>[]) {
  if (!rows.length) return "";
  const headers = Array.from(new Set(rows.flatMap(Object.keys)));
  return [headers.map(escapeCell).join(","), ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(","))].join("\r\n");
}

export function exportToCsv(filename: string, rows: Record<string, CsvValue>[]) {
  if (typeof window === "undefined") return;
  const blob = new Blob(["\uFEFF", rowsToCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.toLowerCase().endsWith(".csv") ? filename : `${filename}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
