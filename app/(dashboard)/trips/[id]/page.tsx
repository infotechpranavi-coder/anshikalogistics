import { notFound, redirect } from "next/navigation";
import { generateInvoiceFromTrip } from "@/actions/invoices";
import { getTripById, updateTrip } from "@/actions/trips";
import { PageHeader } from "@/components/shared/page-header";
import { TripFormPage } from "@/features/trips/trip-form-page";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/session";
import type { TripInput } from "@/schemas";

export default async function EditTripPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { id } = await params;
  const { preview } = await searchParams;
  const user = await requireCompany();
  const [tripResult, vehicles, drivers, company] = await Promise.all([
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
    prisma.driver.findMany({
      where: { companyId: user.companyId, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, phone: true },
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
        bankName: true,
        bankAccount: true,
        bankIfsc: true,
        bankBranch: true,
        city: true,
        state: true,
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

  async function generateInvoice(data: TripInput) {
    "use server";

    const result = await updateTrip(id, { ...data, status: "COMPLETED" });
    if (!result.success) {
      throw new Error(result.error ?? "Unable to save the trip.");
    }
    const invoice = await generateInvoiceFromTrip(id);
    if (!invoice.success || !invoice.data) {
      throw new Error(invoice.error ?? "Unable to generate the invoice.");
    }
    return { invoiceId: invoice.data.id, invoiceNumber: invoice.data.invoiceNumber, tripId: id };
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${trip.tripNumber}`}
        description="Update trip details, then generate the invoice to open Preview."
      />
      <TripFormPage
        tripId={trip.id}
        vehicles={vehicles}
        drivers={drivers}
        company={company}
        initialTab={preview === "1" ? "preview" : "trip"}
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
          acHours: trip.acHours,
          acLitresPerHour: trip.acLitresPerHour,
          acStartTime: trip.acStartTime ?? undefined,
          acEndTime: trip.acEndTime ?? undefined,
          acPaidLt: trip.acPaidLt,
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
          tripNumber: trip.tripNumber,
        }}
        onSubmit={saveTrip}
        onSaveDraft={saveTrip}
        onGenerateInvoice={generateInvoice}
      />
    </div>
  );
}
