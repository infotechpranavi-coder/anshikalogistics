import { notFound } from "next/navigation";
import { getDriverById,updateDriver } from "@/actions/drivers";
import { PageHeader } from "@/components/shared/page-header";
import { DriverForm } from "@/features/drivers/driver-form";
export default async function EditDriverPage({params}:{params:Promise<{id:string}>}){const {id}=await params;const result=await getDriverById(id);if(!result.data)notFound();const d=result.data;return <div className="space-y-6"><PageHeader title={`Edit ${d.name}`} description="Update driver details and license dates."/><DriverForm initial={{...d,alternatePhone:d.alternatePhone??undefined,licenseNumber:d.licenseNumber??undefined,address:d.address??undefined,notes:d.notes??undefined}} onSubmit={updateDriver.bind(null,id)}/></div>}
