"use client";

import { useRouter } from "next/navigation";
import { deleteTrip, duplicateTrip } from "@/actions/trips";
import { TripsTable, type TripTableRow } from "@/features/trips/trips-table";

export function TripsPageTable({ data }: { data: TripTableRow[] }) {
  const router = useRouter();

  async function handleDuplicate(trip: TripTableRow) {
    const result = await duplicateTrip(trip.id);
    if (!result.success) {
      window.alert(result.error ?? "Unable to duplicate the trip.");
      return;
    }
    router.refresh();
  }

  async function handleDelete(trip: TripTableRow) {
    const result = await deleteTrip(trip.id);
    if (!result.success) {
      window.alert(result.error ?? "Unable to delete the trip.");
      return;
    }
    router.refresh();
  }

  return (
    <TripsTable
      data={data}
      onDuplicate={handleDuplicate}
      onDelete={handleDelete}
    />
  );
}

export default TripsPageTable;
