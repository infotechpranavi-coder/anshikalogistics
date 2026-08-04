import Link from "next/link";
import { Plus,Users } from "lucide-react";
import { deleteDriver,getDrivers } from "@/actions/drivers";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { DriversTable } from "@/features/drivers/drivers-table";
export default async function DriversPage(){const drivers=(await getDrivers()).data??[];async function remove(id:string){"use server";await deleteDriver(id)}return <div className="space-y-6"><PageHeader title="Drivers" description="Manage drivers, licenses, and vehicle assignments."><Button asChild><Link href="/drivers/new"><Plus className="h-4 w-4"/>New driver</Link></Button></PageHeader>{drivers.length?<DriversTable data={drivers} onDelete={remove}/>:<EmptyState icon={Users} title="No drivers" description="Add your first driver." action={<Button asChild><Link href="/drivers/new">Add driver</Link></Button>}/>}</div>}
