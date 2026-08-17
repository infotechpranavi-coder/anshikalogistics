"use client";

import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";

export const ExcelImportDialog = dynamic(
  () =>
    import("@/features/trips/excel-import-dialog").then(
      (mod) => mod.ExcelImportDialog
    ),
  {
    ssr: false,
    loading: () => (
      <Button type="button" variant="outline" disabled>
        Import Excel
      </Button>
    ),
  }
);
