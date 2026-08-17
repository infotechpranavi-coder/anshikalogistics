"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteTrip, deleteTrips, duplicateTrip } from "@/actions/trips";
import { TripsTable, type TripTableRow } from "@/features/trips/trips-table";

export function TripsPageTable({
  data: initialData,
  total: initialTotal,
}: {
  data: TripTableRow[];
  total: number;
}) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [total, setTotal] = useState(initialTotal);

  useEffect(() => {
    setData(initialData);
    setTotal(initialTotal);
  }, [initialData, initialTotal]);

  async function handleDuplicate(trip: TripTableRow) {
    const result = await duplicateTrip(trip.id);
    if (!result.success) {
      toast.error(result.error ?? "Unable to duplicate the trip.");
      return;
    }
    router.refresh();
  }

  async function handleDelete(trip: TripTableRow) {
    const result = await deleteTrip(trip.id);
    if (!result.success) {
      toast.error(result.error ?? "Unable to delete the trip.");
      return;
    }
    setData((current) => current.filter((item) => item.id !== trip.id));
    setTotal((current) => Math.max(0, current - 1));
    toast.success(`Deleted ${trip.tripNumber}.`);
    router.refresh();
  }

  async function handleBulkDelete(ids: string[]): Promise<boolean> {
    const result = await deleteTrips(ids);
    if (!result.success) {
      toast.error(result.error ?? "Unable to delete the selected trips.");
      return false;
    }

    const deletedCount = result.data?.count ?? ids.length;
    const deletedIds = new Set(ids);
    setData((current) => current.filter((item) => !deletedIds.has(item.id)));
    setTotal((current) => Math.max(0, current - deletedCount));
    toast.success(
      deletedCount === 1
        ? "Deleted 1 trip."
        : `Deleted ${deletedCount} trips. ${Math.max(0, total - deletedCount)} remaining.`
    );
    router.refresh();
    return true;
  }

  return (
    <TripsTable
      data={data}
      total={total}
      onDuplicate={handleDuplicate}
      onDelete={handleDelete}
      onBulkDelete={handleBulkDelete}
    />
  );
}

export default TripsPageTable;
