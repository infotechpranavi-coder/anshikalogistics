"use client";

import { useState } from "react";
import { IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DriverSalaryPanel,
  type DriverSalaryTarget,
} from "@/features/drivers/driver-salary-panel";

export function DriverSalaryButton({ driver }: { driver: DriverSalaryTarget }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="outline" className="shadow-sm" onClick={() => setOpen(true)}>
        <IndianRupee className="h-4 w-4" />
        Salary payments
      </Button>
      <DriverSalaryPanel driver={driver} open={open} onOpenChange={setOpen} />
    </>
  );
}
