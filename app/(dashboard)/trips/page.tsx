import Link from "next/link";
import { Plus, Route } from "lucide-react";
import { getTrips } from "@/actions/trips";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { TripsPageTable } from "@/features/trips/trips-page-table";

export default async function TripsPage() {
  const result = await getTrips({ pageSize: 100 });
  const trips = result.data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trips"
        description="Plan routes, track trip costs, and manage invoices."
      >
        <Button asChild>
          <Link href="/trips/new">
            <Plus className="h-4 w-4" />
            New Trip
          </Link>
        </Button>
      </PageHeader>

      {!result.success ? (
        <EmptyState
          icon={Route}
          title="Unable to load trips"
          description={result.error ?? "Please refresh the page and try again."}
        />
      ) : trips.length ? (
        <TripsPageTable data={trips} />
      ) : (
        <EmptyState
          icon={Route}
          title="No trips yet"
          description="Create your first trip to begin tracking fleet activity."
          action={
            <Button asChild>
              <Link href="/trips/new">Create first trip</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
