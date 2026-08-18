"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ExcelJS from "exceljs";
import { FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { importTripsFromExcel } from "@/actions/trips";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DIESEL_EXCEL_HEADERS } from "@/lib/excel-template";

export function ExcelImportDialog() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<"import" | "template" | null>(null);
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    vehiclesCreated: number;
    driversCreated: number;
    sheets: string[];
    errors: string[];
  } | null>(null);

  async function downloadTemplate() {
    setBusy("template");
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("3262");
      sheet.addRow(["Driver Change - Sample Driver"]);
      sheet.addRow([...DIESEL_EXCEL_HEADERS]);
      sheet.addRow([
        "06-09-2025",
        "Pune",
        "Thane",
        958,
        1129,
        "Empty",
        171,
        48,
        30,
        18,
        "Local",
        1650,
        "V-102",
        1650,
        "Sample trip",
      ]);
      sheet.getRow(2).font = { bold: true };
      sheet.columns.forEach((column) => {
        column.width = 18;
      });
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer as BlobPart], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "vehicle-diesel-expense-template.xlsx";
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(null);
    }
  }

  async function handleImport() {
    if (!file) {
      toast.error("Choose an Excel file first.");
      return;
    }
    setBusy("import");
    setResult(null);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await importTripsFromExcel(formData);
      if (!response.success || !response.data) {
        toast.error(response.error ?? "Unable to import trips.");
        return;
      }
      setResult(response.data);
      toast.success(`Imported ${response.data.imported} trips.`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to import trips.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <Upload className="h-4 w-4" />
          Import Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl bg-white text-slate-900">
        <DialogHeader>
          <DialogTitle>Import vehicle diesel expense Excel</DialogTitle>
          <DialogDescription className="text-slate-600">
            Use the same format as <span className="font-medium">Vehical Disel Expance</span>: one
            sheet per vehicle, with Date, From, To, Loading KM, Unloading KM, Loaded empty, KM, Lt,
            Paid Lt, Pending Lt, Entry, Desil Amt, and Final Amount.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          Sheet name becomes the vehicle number (for example 3262, 5028). Driver change notes in the
          first row are assigned to following trips.
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setResult(null);
          }}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-left hover:border-teal-400 hover:bg-teal-50/40"
        >
          <FileSpreadsheet className="h-8 w-8 text-teal-700" />
          <span>
            <span className="block text-sm font-semibold text-slate-900">
              {file ? file.name : "Choose Excel file"}
            </span>
            <span className="mt-0.5 block text-xs text-slate-500">.xlsx only, matching the diesel expense workbook</span>
          </span>
        </button>

        {result ? (
          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p>
              Imported <span className="font-semibold">{result.imported}</span> trips, skipped{" "}
              {result.skipped}. Vehicles created: {result.vehiclesCreated}. Drivers created:{" "}
              {result.driversCreated}.
            </p>
            {result.sheets.length ? (
              <p className="text-xs text-slate-500">Sheets: {result.sheets.join(", ")}</p>
            ) : null}
            {result.errors.length ? (
              <ul className="max-h-28 list-disc overflow-auto pl-4 text-xs text-red-600">
                {result.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" disabled={busy !== null} onClick={() => void downloadTemplate()}>
            {busy === "template" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Download template
          </Button>
          <Button type="button" disabled={busy !== null || !file} onClick={() => void handleImport()}>
            {busy === "import" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Import trips
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
