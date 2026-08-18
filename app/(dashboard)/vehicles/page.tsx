import { getDrivers } from "@/actions/drivers";
import { getVehicles } from "@/actions/vehicles";
import { VehiclesPageContent } from "@/features/vehicles/vehicles-page-content";

export default async function VehiclesPage() {
  const [vehiclesResult, driversResult] = await Promise.all([
    getVehicles(),
    getDrivers({ active: true }),
  ]);
  const vehicles = vehiclesResult.data ?? [];
  const drivers = driversResult.data ?? [];

  return <VehiclesPageContent vehicles={vehicles} drivers={drivers} />;
}
