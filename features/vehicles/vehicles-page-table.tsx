"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteVehicle, deleteVehicles } from "@/actions/vehicles";
import { VehiclesTable, type VehicleRow } from "@/features/vehicles/vehicles-table";

export function VehiclesPageTable({ data: initialData }: { data: VehicleRow[] }) {
  const router = useRouter();
  const [data, setData] = useState(initialData);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  async function handleDelete(id: string) {
    const result = await deleteVehicle(id);
    if (!result.success) {
      toast.error(result.error ?? "Unable to delete the vehicle.");
      return;
    }
    setData((current) => current.filter((item) => item.id !== id));
    toast.success("Deleted vehicle.");
    router.refresh();
  }

  async function handleBulkDelete(ids: string[]): Promise<boolean> {
    const result = await deleteVehicles(ids);
    if (!result.success) {
      toast.error(result.error ?? "Unable to delete the selected vehicles.");
      return false;
    }
    const deletedIds = new Set(ids);
    setData((current) => current.filter((item) => !deletedIds.has(item.id)));
    toast.success(
      result.data?.count === 1
        ? "Deleted 1 vehicle."
        : `Deleted ${result.data?.count ?? ids.length} vehicles.`
    );
    router.refresh();
    return true;
  }

  return <VehiclesTable data={data} onDelete={handleDelete} onBulkDelete={handleBulkDelete} />;
}
