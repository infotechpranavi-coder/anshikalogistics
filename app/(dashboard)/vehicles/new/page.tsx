import { createVehicle } from "@/actions/vehicles";
import { getDrivers } from "@/actions/drivers";
import { ModernPanel } from "@/components/shared/modern-panel";
import { PageHeader } from "@/components/shared/page-header";
import { VehicleForm } from "@/features/vehicles/vehicle-form";
import { Truck } from "lucide-react";

export default async function NewVehiclePage() {
  const drivers = (await getDrivers({ active: true })).data ?? [];

  return (
    <div className="page-stack">
      <PageHeader
        badge="Fleet"
        title="New vehicle"
        description="Add a vehicle number and basic fleet details."
      />
      <ModernPanel title="Vehicle details" description="Registration, fuel type, and assignment" icon={Truck}>
        <VehicleForm drivers={drivers} onSubmit={createVehicle} />
      </ModernPanel>
    </div>
  );
}
