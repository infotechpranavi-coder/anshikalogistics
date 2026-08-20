import { notFound } from "next/navigation";
import { getDrivers } from "@/actions/drivers";
import { getVehicleById, updateVehicle } from "@/actions/vehicles";
import { ModernPanel } from "@/components/shared/modern-panel";
import { PageHeader } from "@/components/shared/page-header";
import { VehicleForm } from "@/features/vehicles/vehicle-form";
import { Truck } from "lucide-react";

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
    <div className="page-stack">
      <PageHeader
        badge="Fleet"
        title={`Edit ${vehicle.number}`}
        description="Update the vehicle number and assignment."
      />
      <ModernPanel title="Vehicle details" description="Registration, fuel type, and assignment" icon={Truck}>
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
      </ModernPanel>
    </div>
  );
}
