import { redirect } from "next/navigation";
import { createTrip } from "@/actions/trips";
import { PageHeader } from "@/components/shared/page-header";
import { TripFormPage } from "@/features/trips/trip-form-page";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/session";
import type { TripInput } from "@/schemas";

export default async function NewTripPage() {
  const user = await requireCompany();
  const [vehicles, company] = await Promise.all([
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

  async function saveTrip(data: TripInput) {
    "use server";

    const result = await createTrip(data);
    if (!result.success || !result.data) {
      throw new Error(result.error ?? "Unable to save the trip.");
    }
    redirect("/trips");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Trip"
        description="Enter trip details on the left. Invoice preview updates live on the right."
      />
      <TripFormPage
        vehicles={vehicles}
        company={company}
        nextInvoiceNumber={`${company.invoicePrefix}-DRAFT`}
        onSubmit={saveTrip}
        onSaveDraft={saveTrip}
      />
    </div>
  );
}
