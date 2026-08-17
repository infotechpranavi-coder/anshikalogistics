import dynamic from "next/dynamic";
import Link from "next/link";
import { Plus, Route } from "lucide-react";
import { getTrips } from "@/actions/trips";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { TripsPageTable } from "@/features/trips/trips-page-table";

const ExcelImportDialog = dynamic(
  () =>
    import("@/features/trips/excel-import-dialog").then(
      (mod) => mod.ExcelImportDialog
    ),
  {
    ssr: false,
    loading: () => (
      <Button type="button" variant="outline" disabled>
        Import Excel
      </Button>
    ),
  }
);

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const result = await getTrips({ page, pageSize: 50 });
  const trips = result.data?.data ?? [];
  const total = result.data?.total ?? trips.length;
  const hasMore = (result.data?.totalPages ?? page) > page;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trips"
        description="Plan routes, track trip costs, and manage invoices."
      >
        <ExcelImportDialog />
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
        <TripsPageTable
          data={trips}
          total={total}
          page={page}
          hasMore={hasMore}
        />
      ) : (
        <EmptyState
          icon={Route}
          title="No trips yet"
          description="Create a trip or import the Vehicle Diesel Expense Excel workbook."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <ExcelImportDialog />
              <Button asChild>
                <Link href="/trips/new">Create first trip</Link>
              </Button>
            </div>
          }
        />
      )}
    </div>
  );
}
