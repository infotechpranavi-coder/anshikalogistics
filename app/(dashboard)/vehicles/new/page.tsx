import { createVehicle } from "@/actions/vehicles";
import { getDrivers } from "@/actions/drivers";
import { PageHeader } from "@/components/shared/page-header";
import { VehicleForm } from "@/features/vehicles/vehicle-form";
export default async function NewVehiclePage() {
  const drivers = (await getDrivers({ active: true })).data ?? [];
  return (
    <div className="space-y-6">
      <PageHeader title="New vehicle" description="Add a vehicle number and basic fleet details." />
      <VehicleForm drivers={drivers} onSubmit={createVehicle} />
    </div>
  );
}
