"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteDriver, deleteDrivers } from "@/actions/drivers";
import { DriversTable, type DriverRow } from "@/features/drivers/drivers-table";

export function DriversPageTable({ data: initialData }: { data: DriverRow[] }) {
  const router = useRouter();
  const [data, setData] = useState(initialData);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  async function handleDelete(id: string) {
    const result = await deleteDriver(id);
    if (!result.success) {
      toast.error(result.error ?? "Unable to delete the driver.");
      return;
    }
    setData((current) => current.filter((item) => item.id !== id));
    toast.success("Deleted driver.");
    router.refresh();
  }

  async function handleBulkDelete(ids: string[]): Promise<boolean> {
    const result = await deleteDrivers(ids);
    if (!result.success) {
      toast.error(result.error ?? "Unable to delete the selected drivers.");
      return false;
    }
    const deletedIds = new Set(ids);
    setData((current) => current.filter((item) => !deletedIds.has(item.id)));
    toast.success(
      result.data?.count === 1
        ? "Deleted 1 driver."
        : `Deleted ${result.data?.count ?? ids.length} drivers.`
    );
    router.refresh();
    return true;
  }

  return <DriversTable data={data} onDelete={handleDelete} onBulkDelete={handleBulkDelete} />;
}
