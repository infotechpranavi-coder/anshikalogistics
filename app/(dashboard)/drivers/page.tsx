import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { getDrivers } from "@/actions/drivers";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { DriversPageTable } from "@/features/drivers/drivers-page-table";

export default async function DriversPage() {
  const drivers = (await getDrivers()).data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Drivers" description="Manage drivers, licenses, and vehicle assignments.">
        <Button asChild>
          <Link href="/drivers/new">
            <Plus className="h-4 w-4" />
            New driver
          </Link>
        </Button>
      </PageHeader>
      {drivers.length ? (
        <DriversPageTable data={drivers} />
      ) : (
        <EmptyState
          icon={Users}
          title="No drivers"
          description="Add your first driver."
          action={
            <Button asChild>
              <Link href="/drivers/new">Add driver</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
