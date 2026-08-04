import { redirect } from "next/navigation";
import { createTrip } from "@/actions/trips";
import { PageHeader } from "@/components/shared/page-header";
import { TripFormPage } from "@/features/trips/trip-form-page";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/session";
import { generateInvoiceNumber } from "@/lib/utils";
import type { TripInput } from "@/schemas";

export default async function NewTripPage() {
  const user = await requireCompany();
  const [vehicles, drivers, company, invoiceCount] = await Promise.all([
    prisma.vehicle.findMany({
      where: { companyId: user.companyId, status: "ACTIVE" },
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
        invoiceStartingNumber: true,
      },
    }),
    prisma.invoice.count({ where: { companyId: user.companyId } }),
  ]);

  async function saveTrip(data: TripInput) {
    "use server";

    const result = await createTrip(data);
    if (!result.success || !result.data) {
      throw new Error(result.error ?? "Unable to save the trip.");
    }
    redirect(`/trips/${result.data.id}`);
  }

  const nextInvoiceNumber = generateInvoiceNumber(
    company.invoicePrefix,
    company.invoiceStartingNumber + invoiceCount
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Trip"
        description="Fill trip details on the left. Invoice preview updates live on the right."
      />
      <TripFormPage
        vehicles={vehicles}
        drivers={drivers}
        company={company}
        nextInvoiceNumber={nextInvoiceNumber}
        onSubmit={saveTrip}
        onSaveDraft={saveTrip}
      />
    </div>
  );
}
