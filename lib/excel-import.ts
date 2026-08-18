import ExcelJS from "exceljs";

export interface ExcelTripRow {
  sheetName: string;
  vehicleNumber: string;
  driverName: string | null;
  tripDate: Date;
  source: string;
  destination: string;
  loadingKm: number;
  unloadingKm: number;
  distance: number;
  isLoaded: boolean;
  isEmpty: boolean;
  fuelFilled: number;
  fuelRequired: number;
  pendingLt: number;
  fuelCost: number;
  voucherAmount: number;
  voucherNumber: string;
  grandTotal: number;
  paidAmount: number;
  pendingAmount: number;
  entry: string;
  narration: string;
  rowNumber: number;
}

export interface ExcelParseResult {
  trips: ExcelTripRow[];
  skipped: number;
  sheets: string[];
  errors: string[];
}

type HeaderMap = Record<string, number>;

function cellText(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "string") return value.trim();
  if (typeof value === "object") {
    const obj = value as {
      text?: string;
      result?: unknown;
      richText?: Array<{ text?: string }>;
      hyperlink?: string;
    };
    if (obj.result != null) return cellText(obj.result);
    if (obj.text) return String(obj.text).trim();
    if (Array.isArray(obj.richText)) {
      return obj.richText.map((part) => part.text ?? "").join("").trim();
    }
    if (obj.hyperlink) return String(obj.hyperlink);
  }
  return String(value).trim();
}

function cellNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "object" && value && "result" in (value as object)) {
    return cellNumber((value as { result?: unknown }).result);
  }
  const text = cellText(value).replace(/,/g, "");
  if (!text) return 0;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeYear(year: number): number | null {
  if (year >= 2000 && year <= 2099) return year;
  if (year >= 0 && year <= 99) return 2000 + year;
  if (year >= 100 && year <= 199) return 1900 + year;
  return null;
}

function toUtcDateOnly(year: number, monthIndex: number, day: number): Date | null {
  const safeYear = normalizeYear(year);
  if (safeYear == null || monthIndex < 0 || monthIndex > 11 || day < 1 || day > 31) {
    return null;
  }
  const date = new Date(Date.UTC(safeYear, monthIndex, day));
  if (
    date.getUTCFullYear() !== safeYear ||
    date.getUTCMonth() !== monthIndex ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

function parseDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return toUtcDateOnly(value.getFullYear(), value.getMonth(), value.getDate());
  }
  if (typeof value === "object" && value && "result" in (value as object)) {
    return parseDate((value as { result?: unknown }).result);
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    // Excel serial dates for years 2000-2099 are roughly 36526-73050.
    if (value < 36526 || value > 73050) return null;
    const utcDays = Math.round(value - 25569);
    const date = new Date(utcDays * 86400000);
    if (Number.isNaN(date.getTime())) return null;
    return toUtcDateOnly(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  }
  const text = cellText(value);
  if (!text) return null;
  const dmy = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = Number(dmy[3]);
    return toUtcDateOnly(year < 100 ? 2000 + year : year, month - 1, day);
  }
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return toUtcDateOnly(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function vehicleNumberFromSheet(name: string): string {
  const match = name.match(/\d{3,}/);
  return match ? match[0] : name.trim();
}

function driverFromNote(text: string): string | null {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!/driver/i.test(cleaned)) return null;
  const match = cleaned.match(
    /driver\s*(?:change|chenge|cheng)?\s*[-:=]?\s*(.+?)(?:\s*[=:-]\s*\d{1,2}[./-]\d{1,2}[./-]\d{2,4}.*)?$/i
  );
  if (!match?.[1]) return null;
  const name = match[1]
    .replace(/\d{1,2}[./-]\d{1,2}[./-]\d{2,4}/g, "")
    .replace(/\bto\b.*$/i, "")
    .replace(/local/gi, "")
    .trim();
  return name.length >= 2 ? name : null;
}

function isHeaderRow(values: string[]): boolean {
  const joined = values.map(normalizeHeader).join(" | ");
  return joined.includes("date") && (joined.includes("from") || joined.includes("loading"));
}

function mapHeaders(row: ExcelJS.Row): HeaderMap | null {
  const map: HeaderMap = {};
  row.eachCell({ includeEmpty: false }, (cell, col) => {
    const key = normalizeHeader(cellText(cell.value));
    if (!key) return;
    if (key === "date") map.date = col;
    else if (key === "from" || key === "source") map.source = col;
    else if (key === "to" || key === "destination") map.destination = col;
    else if (key.includes("loading")) map.loadingKm = col;
    else if (key.includes("unloading")) map.unloadingKm = col;
    else if (key.includes("loaded")) map.loadedEmpty = col;
    else if (key === "km") map.km = col;
    else if (key === "lt") map.litre = col;
    else if (key.includes("paid lt")) map.paidLt = col;
    else if (key.includes("pending lt")) map.pendingLt = col;
    else if (key === "entry") map.entry = col;
    else if (key.includes("desil") || key.includes("diesel amt") || key.includes("diesel amount")) {
      map.dieselAmt = col;
    }
    else if (key === "amount") map.amount = col;
    else if (key.includes("voucher")) map.voucher = col;
    else if (key.includes("final amount")) map.finalAmount = col;
    else if (key.includes("paid in diesel") || key === "paid") map.paidDiesel = col;
    else if (key.includes("pending")) map.pending = col;
    else if (key.includes("narration")) map.narration = col;
  });
  return map.date && map.source && map.destination ? map : null;
}

function isLoadedValue(value: string): boolean {
  const text = value.toLowerCase();
  if (text.includes("empty")) return false;
  return text.includes("load");
}

function getCell(row: ExcelJS.Row, col?: number): unknown {
  if (!col) return null;
  return row.getCell(col).value;
}

export async function parseDieselExpenseWorkbook(
  buffer: ArrayBuffer | Buffer
): Promise<ExcelParseResult> {
  const workbook = new ExcelJS.Workbook();
  const data = Buffer.isBuffer(buffer)
    ? buffer
    : Buffer.from(new Uint8Array(buffer as ArrayBuffer));
  await workbook.xlsx.load(data as unknown as ArrayBuffer);
  const trips: ExcelTripRow[] = [];
  const errors: string[] = [];
  const sheets: string[] = [];
  let skipped = 0;

  for (const sheet of workbook.worksheets) {
    sheets.push(sheet.name);
    const vehicleNumber = vehicleNumberFromSheet(sheet.name);
    let headers: HeaderMap | null = null;
    let currentDriver: string | null = null;

    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      const texts: string[] = [];
      row.eachCell({ includeEmpty: false }, (cell) => {
        const text = cellText(cell.value);
        if (text) texts.push(text);
      });
      if (!texts.length) {
        skipped += 1;
        return;
      }

      if (isHeaderRow(texts)) {
        headers = mapHeaders(row);
        return;
      }

      const noteDriver = driverFromNote(texts.join(" "));
      if (noteDriver && !parseDate(row.getCell(1).value)) {
        currentDriver = noteDriver;
        return;
      }

      if (!headers) {
        skipped += 1;
        return;
      }

      const tripDate = parseDate(getCell(row, headers.date));
      const source = cellText(getCell(row, headers.source));
      const destination = cellText(getCell(row, headers.destination));
      const loadingKm = cellNumber(getCell(row, headers.loadingKm));
      const unloadingKm = cellNumber(getCell(row, headers.unloadingKm));

      if (!tripDate || !source || !destination || (loadingKm <= 0 && unloadingKm <= 0)) {
        skipped += 1;
        return;
      }

      const loadedText = cellText(getCell(row, headers.loadedEmpty));
      const isLoaded = loadedText ? isLoadedValue(loadedText) : true;
      const distanceFromSheet = cellNumber(getCell(row, headers.km));
      const distance = distanceFromSheet > 0 ? distanceFromSheet : Math.max(0, unloadingKm - loadingKm);
      const fuelRequired = cellNumber(getCell(row, headers.litre));
      const fuelFilled = cellNumber(getCell(row, headers.paidLt));
      // Always auto-calculate Pending Lt from Lt and Paid Lt (ignore the sheet's Pending Lt column).
      const pendingLt = Math.max(0, fuelRequired - fuelFilled);
      const voucherText = cellText(getCell(row, headers.voucher));
      const voucherAmount = cellNumber(getCell(row, headers.voucher));
      const fuelCost =
        cellNumber(getCell(row, headers.dieselAmt)) || cellNumber(getCell(row, headers.amount));
      const grandTotal =
        cellNumber(getCell(row, headers.finalAmount)) || fuelCost + voucherAmount;
      const paidAmount = cellNumber(getCell(row, headers.paidDiesel));
      const pendingAmount =
        cellNumber(getCell(row, headers.pending)) || Math.max(0, grandTotal - paidAmount);
      const entry = cellText(getCell(row, headers.entry));

      trips.push({
        sheetName: sheet.name,
        vehicleNumber,
        driverName: currentDriver,
        tripDate,
        source,
        destination,
        loadingKm,
        unloadingKm,
        distance,
        isLoaded,
        isEmpty: !isLoaded,
        fuelFilled,
        fuelRequired,
        pendingLt,
        fuelCost,
        voucherAmount,
        voucherNumber: voucherText,
        grandTotal,
        paidAmount,
        pendingAmount,
        entry,
        narration: cellText(getCell(row, headers.narration)),
        rowNumber,
      });
    });
  }

  if (!trips.length) {
    errors.push("No trip rows were found. Use the Vehicle Diesel Expense Excel format.");
  }

  return { trips, skipped, sheets, errors };
}
