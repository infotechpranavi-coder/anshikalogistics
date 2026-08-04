import Link from "next/link";
import { Car,Plus } from "lucide-react";
import { deleteVehicle,getVehicles } from "@/actions/vehicles";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { VehiclesTable } from "@/features/vehicles/vehicles-table";

export default async function VehiclesPage(){
 const result=await getVehicles();const vehicles=result.data??[];
 async function remove(id:string){"use server";await deleteVehicle(id)}
 return <div className="space-y-6"><PageHeader title="Vehicles" description="Manage fleet details, assignments, and document expiries."><Button asChild><Link href="/vehicles/new"><Plus className="h-4 w-4"/>New vehicle</Link></Button></PageHeader>{vehicles.length?<VehiclesTable data={vehicles} onDelete={remove}/>:<EmptyState icon={Car} title="No vehicles" description="Add your first vehicle to begin tracking fleet operations." action={<Button asChild><Link href="/vehicles/new">Add vehicle</Link></Button>}/>}</div>
}
