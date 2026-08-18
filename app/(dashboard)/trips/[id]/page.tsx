import { notFound, redirect } from "next/navigation";
import { getTripById, updateTrip } from "@/actions/trips";
import { PageHeader } from "@/components/shared/page-header";
import { TripFormPage } from "@/features/trips/trip-form-page";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/session";
import type { TripInput } from "@/schemas";

export default async function EditTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireCompany();
  const [tripResult, vehicles, company] = await Promise.all([
    getTripById(id),
    prisma.vehicle.findMany({
      where: { companyId: user.companyId },
      orderBy: { number: "asc" },
      select: {
        id: true,
        number: true,
        type: true,
        owner: true,
        fuelType: true,
        mileage: true,
      },
    }),
    prisma.company.findUniqueOrThrow({
      where: { id: user.companyId },
      select: {
        name: true,
        logo: true,
        address: true,
        phone: true,
        email: true,
        gst: true,
        signature: true,
        upiId: true,
        invoicePrefix: true,
      },
    }),
  ]);

  if (!tripResult.success || !tripResult.data) notFound();
  const trip = tripResult.data;

  async function saveTrip(data: TripInput) {
    "use server";

    const result = await updateTrip(id, data);
    if (!result.success) {
      throw new Error(result.error ?? "Unable to update the trip.");
    }
    redirect("/trips");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${trip.tripNumber}`}
        description="Update trip, fuel, expense, and payment details."
      />
      <TripFormPage
        tripId={trip.id}
        vehicles={vehicles}
        company={company}
        nextInvoiceNumber={trip.invoice?.invoiceNumber ?? `${company.invoicePrefix}-DRAFT`}
        defaultValues={{
          vehicleId: trip.vehicleId,
          vehicleNumber: trip.vehicle.number,
          vehicleType: trip.vehicle.type,
          owner: trip.vehicle.owner ?? undefined,
          fuelType: trip.vehicle.fuelType,
          driverId: trip.driverId ?? undefined,
          driverName: trip.driver?.name,
          driverPhone: trip.driverPhone ?? trip.driver?.phone ?? undefined,
          tripDate: trip.tripDate,
          tripTime: trip.tripTime ?? undefined,
          source: trip.source,
          destination: trip.destination,
          loadingKm: trip.loadingKm,
          unloadingKm: trip.unloadingKm,
          distance: trip.distance,
          isLoaded: trip.isLoaded,
          isEmpty: trip.isEmpty,
          remarks: trip.remarks ?? undefined,
          dieselRate: trip.dieselRate,
          mileage: trip.mileage,
          fuelRequired: trip.fuelRequired,
          fuelFilled: trip.fuelFilled,
          fuelCost: trip.fuelCost,
          grandTotal: trip.grandTotal,
          toll: trip.toll,
          parking: trip.parking,
          food: trip.food,
          repair: trip.repair,
          policeFine: trip.policeFine,
          advance: trip.advance,
          miscExpense: trip.miscExpense,
          voucherNumber: trip.voucherNumber ?? undefined,
          narration: trip.narration ?? undefined,
          paidAmount: trip.paidAmount,
          paymentMethod: trip.paymentMethod ?? undefined,
          extraExpenses: (trip.expenses ?? []).map((e) => ({ title: e.title, amount: e.amount })),
          status: trip.status,
        }}
        onSubmit={saveTrip}
        onSaveDraft={saveTrip}
      />
    </div>
  );
}
