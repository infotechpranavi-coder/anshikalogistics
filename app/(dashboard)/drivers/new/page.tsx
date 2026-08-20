import { createDriver } from "@/actions/drivers";
import { ModernPanel } from "@/components/shared/modern-panel";
import { PageHeader } from "@/components/shared/page-header";
import { DriverForm } from "@/features/drivers/driver-form";
import { UserRound } from "lucide-react";

export default function NewDriverPage() {
  return (
    <div className="page-stack">
      <PageHeader
        badge="Fleet"
        title="New driver"
        description="Add personal, license, and employment details."
      />
      <ModernPanel title="Driver details" description="Basic information and license records" icon={UserRound}>
        <DriverForm onSubmit={createDriver} />
      </ModernPanel>
    </div>
  );
}
