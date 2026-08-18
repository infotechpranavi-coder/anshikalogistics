"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createVehicle } from "@/actions/vehicles";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VehicleForm } from "@/features/vehicles/vehicle-form";
import { VehiclesPageTable } from "@/features/vehicles/vehicles-page-table";
import type { VehicleRow } from "@/features/vehicles/vehicles-table";

export function VehiclesPageContent({
  vehicles: initialVehicles,
  drivers,
}: {
  vehicles: VehicleRow[];
  drivers: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [vehicles, setVehicles] = useState(initialVehicles);

  useEffect(() => {
    setVehicles(initialVehicles);
  }, [initialVehicles]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicles"
        description="Manage fleet details, assignments, and document expiries."
      >
        <Button type="button" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Add vehicle
        </Button>
      </PageHeader>

      <VehiclesPageTable data={vehicles} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg bg-white text-slate-900">
          <DialogHeader>
            <DialogTitle>Add vehicle</DialogTitle>
            <DialogDescription className="text-slate-600">
              Enter the vehicle number and basic fleet details. The new row appears in the table after you save.
            </DialogDescription>
          </DialogHeader>
          <VehicleForm
            key={open ? "open" : "closed"}
            embedded
            drivers={drivers}
            onSubmit={createVehicle}
            onCancel={() => setOpen(false)}
            onCreated={(vehicle) => {
              setVehicles((current) => {
                const exists = current.some((item) => item.id === vehicle.id);
                if (exists) return current;
                return [...current, vehicle].sort((a, b) => a.number.localeCompare(b.number));
              });
              toast.success(`Added vehicle ${vehicle.number}.`);
              setOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
