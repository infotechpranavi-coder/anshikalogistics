import { createDriver } from "@/actions/drivers";
import { PageHeader } from "@/components/shared/page-header";
import { DriverForm } from "@/features/drivers/driver-form";
export default function NewDriverPage(){return <div className="space-y-6"><PageHeader title="New driver" description="Add personal, license, and employment details."/><DriverForm onSubmit={createDriver}/></div>}
