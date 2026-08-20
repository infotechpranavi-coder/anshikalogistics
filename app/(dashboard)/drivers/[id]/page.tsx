import { notFound } from "next/navigation";
import { getDriverById, updateDriver } from "@/actions/drivers";
import { ModernPanel } from "@/components/shared/modern-panel";
import { PageHeader } from "@/components/shared/page-header";
import { DriverForm } from "@/features/drivers/driver-form";
import { DriverSalaryButton } from "@/features/drivers/driver-salary-button";
import { UserRound } from "lucide-react";

export default async function EditDriverPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getDriverById(id);
  if (!result.data) notFound();
  const d = result.data;

  return (
    <div className="page-stack">
      <PageHeader
        badge="Fleet"
        title={`Edit ${d.name}`}
        description="Update driver details, monthly salary, and license dates."
      >
        <DriverSalaryButton driver={{ id: d.id, name: d.name, salary: d.salary }} />
      </PageHeader>
      <ModernPanel title="Driver details" description="Basic information and license records" icon={UserRound}>
        <DriverForm
          initial={{
            ...d,
            alternatePhone: d.alternatePhone ?? undefined,
            licenseNumber: d.licenseNumber ?? undefined,
            address: d.address ?? undefined,
            notes: d.notes ?? undefined,
          }}
          onSubmit={updateDriver.bind(null, id)}
        />
      </ModernPanel>
    </div>
  );
}
