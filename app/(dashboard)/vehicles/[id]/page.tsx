import { notFound } from "next/navigation";
import { getDrivers } from "@/actions/drivers";
import { getVehicleById,updateVehicle } from "@/actions/vehicles";
import { PageHeader } from "@/components/shared/page-header";
import { VehicleForm } from "@/features/vehicles/vehicle-form";
export default async function EditVehiclePage({params}:{params:Promise<{id:string}>}){const {id}=await params;const [vehicleResult,driverResult]=await Promise.all([getVehicleById(id),getDrivers({active:true})]);if(!vehicleResult.data)notFound();const v=vehicleResult.data;return <div className="space-y-6"><PageHeader title={`Edit ${v.number}`} description="Update vehicle and compliance information."/><VehicleForm initial={{...v,make:v.make??undefined,model:v.model??undefined,owner:v.owner??undefined,insuranceNumber:v.insuranceNumber??undefined,chassisNumber:v.chassisNumber??undefined,engineNumber:v.engineNumber??undefined,notes:v.notes??undefined}} drivers={driverResult.data??[]} onSubmit={updateVehicle.bind(null,id)}/></div>}
