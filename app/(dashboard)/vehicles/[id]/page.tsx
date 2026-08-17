import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Plus, Route } from "lucide-react";
import { getTrips } from "@/actions/trips";
import { getVehicleById } from "@/actions/vehicles";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TripsPageTable } from "@/features/trips/trips-page-table";

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [vehicleResult, tripsResult] = await Promise.all([
    getVehicleById(id),
    getTrips({ pageSize: 50, vehicleId: id }),
  ]);
  if (!vehicleResult.data) notFound();

  const vehicle = vehicleResult.data;
  const trips = tripsResult.data?.data ?? [];
  const total = tripsResult.data?.total ?? trips.length;
  const statusVariant =
    vehicle.status === "ACTIVE" ? "success" : vehicle.status === "MAINTENANCE" ? "warning" : "secondary";

  return (
    <div className="space-y-6">
      <PageHeader
        title={vehicle.number}
        description={`${vehicle.type} · ${vehicle.fuelType}${vehicle.currentDriver?.name ? ` · ${vehicle.currentDriver.name}` : ""}`}
      >
        <Badge variant={statusVariant}>{vehicle.status}</Badge>
        <Button asChild variant="outline">
          <Link href={`/vehicles/${id}/edit`}>
            <Pencil className="h-4 w-4" />
            Edit vehicle
          </Link>
        </Button>
        <Button asChild>
          <Link href="/trips/new">
            <Plus className="h-4 w-4" />
            New trip
          </Link>
        </Button>
      </PageHeader>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Vehicle number</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Fuel</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Driver</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-3 font-semibold">{vehicle.number}</td>
              <td className="px-4 py-3">{vehicle.type}</td>
              <td className="px-4 py-3">{vehicle.fuelType}</td>
              <td className="px-4 py-3">
                <Badge variant={statusVariant}>{vehicle.status}</Badge>
              </td>
              <td className="px-4 py-3">{vehicle.currentDriver?.name ?? "Unassigned"}</td>
              <td className="px-4 py-3 text-right">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/vehicles/${id}/edit`}>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Link>
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {trips.length ? (
        <TripsPageTable data={trips} total={total} />
      ) : (
        <EmptyState
          icon={Route}
          title="No trips for this vehicle"
          description="Create a trip or import Excel rows for this vehicle number."
          action={
            <Button asChild>
              <Link href="/trips/new">Add trip</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
