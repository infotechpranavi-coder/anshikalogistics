"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowRight,
  CircleDollarSign,
  FileText,
  Fuel,
  Gauge,
  MapPinned,
  Plus,
  ReceiptText,
  Route,
  Truck,
  Users,
  WalletCards,
} from "lucide-react";
import type { ComponentType } from "react";
import type { DashboardData } from "@/actions/dashboard";
import { EmptyState } from "@/components/shared/empty-state";
import { ModernPanel } from "@/components/shared/modern-panel";
import { PageHeader } from "@/components/shared/page-header";
import { SectionHeading } from "@/components/shared/section-heading";
import { StatCard } from "@/components/shared/stat-card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

const DashboardCharts = dynamic(
  () =>
    import("@/features/dashboard/dashboard-charts").then(
      (mod) => mod.DashboardCharts
    ),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-[1.25rem] bg-slate-100 lg:col-span-2" />
        <div className="h-72 animate-pulse rounded-[1.25rem] bg-slate-100" />
        <div className="h-72 animate-pulse rounded-[1.25rem] bg-slate-100" />
      </div>
    ),
  }
);

export type DashboardViewProps = DashboardData;

const statusVariants: Record<string, BadgeProps["variant"]> = {
  DRAFT: "secondary",
  PENDING: "warning",
  IN_PROGRESS: "info",
  GENERATED: "info",
  SENT: "warning",
  COMPLETED: "success",
  PAID: "success",
  CANCELLED: "destructive",
};

export function DashboardView({
  stats,
  monthlyExpenses,
  fuelConsumption,
  vehicleUsage,
  tripsPerMonth,
  expenseBreakdown,
  recentTrips,
  recentInvoices,
}: DashboardViewProps) {
  return (
    <div className="page-stack">
      <PageHeader
        badge="Overview"
        title="Anshika Logistics"
        description="Monitor trips, diesel costs, vehicles, and collections."
      >
        <Button asChild className="shadow-sm">
          <Link href="/trips/new">
            <Plus className="h-4 w-4" />
            New trip
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Today's trips"
          value={stats.todaysTrips}
          description="Trips scheduled today"
          icon={Route}
        />
        <StatCard
          title="Today's expenses"
          value={formatCurrency(stats.todaysExpense)}
          description="Trip and recorded expenses"
          icon={WalletCards}
        />
        <StatCard
          title="Today's fuel cost"
          value={formatCurrency(stats.todaysDieselCost)}
          description="Fuel spend for today's trips"
          icon={Fuel}
        />
        <StatCard
          title="Monthly expenses"
          value={formatCurrency(stats.monthlyExpense)}
          description="Current month"
          icon={CircleDollarSign}
        />
        <StatCard
          title="Active vehicles"
          value={stats.runningVehicles}
          description="Vehicles available for service"
          icon={Truck}
        />
        <StatCard
          title="Completed trips"
          value={stats.completedTrips}
          description="All-time completed trips"
          icon={Route}
        />
        <StatCard
          title="Pending payments"
          value={formatCurrency(stats.pendingPayments)}
          description="Outstanding invoice balance"
          icon={ReceiptText}
        />
        <StatCard
          title="Average mileage"
          value={`${stats.averageMileage.toFixed(1)} km/l`}
          description="Across registered vehicles"
          icon={Gauge}
        />
        <StatCard
          title="Fuel consumed"
          value={`${stats.fuelConsumption.toLocaleString("en-IN", {
            maximumFractionDigits: 1,
          })} L`}
          description="Last six months"
          icon={Fuel}
        />
        <StatCard
          title="Distance travelled"
          value={`${stats.distanceTravelled.toLocaleString("en-IN", {
            maximumFractionDigits: 0,
          })} km`}
          description="Last six months"
          icon={MapPinned}
        />
      </div>

      <section className="space-y-4">
        <SectionHeading title="Performance trends" description="Last six months" />
        <DashboardCharts
          monthlyExpenses={monthlyExpenses}
          fuelConsumption={fuelConsumption}
          expenseBreakdown={expenseBreakdown}
          tripsPerMonth={tripsPerMonth}
          vehicleUsage={vehicleUsage}
        />
      </section>

      <section className="space-y-4">
        <SectionHeading title="Quick actions" description="Common fleet workflows" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction href="/trips/new" icon={Plus} label="Create trip" />
          <QuickAction href="/vehicles" icon={Truck} label="Manage vehicles" />
          <QuickAction href="/drivers" icon={Users} label="Manage drivers" />
          <QuickAction href="/invoices" icon={FileText} label="View invoices" />
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading title="Recent activity" description="Latest fleet records" />
        <div className="grid gap-5 2xl:grid-cols-2">
          <ModernPanel
            title="Recent trips"
            action={
              <Button asChild variant="ghost" size="sm">
                <Link href="/trips">
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            }
            bodyClassName="p-0 sm:p-0"
          >
            {recentTrips.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trip</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTrips.map((trip) => (
                    <TableRow key={trip.id}>
                      <TableCell className="font-medium">
                        <Link className="hover:text-teal-700" href={`/trips/${trip.id}`}>
                          {trip.tripNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{formatDate(trip.tripDate)}</TableCell>
                      <TableCell>{trip.vehicle.number}</TableCell>
                      <TableCell className="max-w-64 truncate">
                        {trip.source} → {trip.destination}
                      </TableCell>
                      <TableCell>{formatCurrency(trip.grandTotal)}</TableCell>
                      <TableCell>
                        <StatusBadge status={trip.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <CompactEmpty title="No trips yet" description="Create a trip to see activity here." />
            )}
          </ModernPanel>

          <ModernPanel
            title="Recent invoices"
            action={
              <Button asChild variant="ghost" size="sm">
                <Link href="/invoices">
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            }
            bodyClassName="p-0 sm:p-0"
          >
            {recentInvoices.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Pending</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <div className="font-medium">{invoice.invoiceNumber}</div>
                        <div className="text-xs text-slate-500">{invoice.trip.tripNumber}</div>
                      </TableCell>
                      <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                      <TableCell>{formatCurrency(invoice.grandTotal)}</TableCell>
                      <TableCell>
                        <span className={invoice.pendingAmount > 0 ? "text-amber-700" : ""}>
                          {formatCurrency(invoice.pendingAmount)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <CompactEmpty
                title="No invoices yet"
                description="Generated invoices will appear here."
              />
            )}
          </ModernPanel>
        </div>
      </section>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group flex h-auto items-center justify-between rounded-[1.15rem] border border-slate-200/80 bg-white px-4 py-4 text-slate-700 shadow-[0_12px_40px_-28px_rgba(15,23,42,0.35)] transition-all hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-[0_18px_50px_-28px_rgba(15,118,110,0.25)]"
    >
      <span className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700 transition-colors group-hover:bg-teal-100">
          <Icon className="h-4 w-4" />
        </span>
        <span className="font-semibold">{label}</span>
      </span>
      <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-600" />
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={statusVariants[status] ?? "outline"}>
      {status.replaceAll("_", " ")}
    </Badge>
  );
}

function CompactEmpty({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-4 [&>div]:min-h-48 [&>div]:shadow-none">
      <EmptyState icon={ReceiptText} title={title} description={description} />
    </div>
  );
}

export default DashboardView;
