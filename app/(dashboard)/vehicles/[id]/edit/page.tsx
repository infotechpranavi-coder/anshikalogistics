import { notFound } from "next/navigation";
import { getDrivers } from "@/actions/drivers";
import { getVehicleById, updateVehicle } from "@/actions/vehicles";
import { PageHeader } from "@/components/shared/page-header";
import { VehicleForm } from "@/features/vehicles/vehicle-form";

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [vehicleResult, driverResult] = await Promise.all([
    getVehicleById(id),
    getDrivers({ active: true }),
  ]);
  if (!vehicleResult.data) notFound();
  const vehicle = vehicleResult.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${vehicle.number}`}
        description="Update the vehicle number and assignment."
      />
      <VehicleForm
        initial={{
          number: vehicle.number,
          type: vehicle.type,
          fuelType: vehicle.fuelType,
          status: vehicle.status,
          currentDriverId: vehicle.currentDriverId,
        }}
        drivers={driverResult.data ?? []}
        onSubmit={updateVehicle.bind(null, id)}
      />
    </div>
  );
}
