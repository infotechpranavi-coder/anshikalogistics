import { redirect } from "next/navigation";
import { generateInvoiceFromTrip } from "@/actions/invoices";
import { createTrip } from "@/actions/trips";
import { PageHeader } from "@/components/shared/page-header";
import { TripFormPage } from "@/features/trips/trip-form-page";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/session";
import type { TripInput } from "@/schemas";

export default async function NewTripPage() {
  const user = await requireCompany();
  const [vehicles, drivers, company] = await Promise.all([
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
        bankName: true,
        bankAccount: true,
        bankIfsc: true,
        bankBranch: true,
        city: true,
        state: true,
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

  async function generateInvoice(data: TripInput) {
    "use server";

    const result = await createTrip({ ...data, status: "COMPLETED" });
    if (!result.success || !result.data) {
      throw new Error(result.error ?? "Unable to save the trip.");
    }
    const invoice = await generateInvoiceFromTrip(result.data.id);
    if (!invoice.success || !invoice.data) {
      throw new Error(invoice.error ?? "Unable to generate the invoice.");
    }
    return { invoiceId: invoice.data.id, invoiceNumber: invoice.data.invoiceNumber, tripId: result.data.id };
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Trip"
        description="Enter trip details, then generate the invoice to open Preview."
      />
      <TripFormPage
        vehicles={vehicles}
        drivers={drivers}
        company={company}
        nextInvoiceNumber={`${company.invoicePrefix}-DRAFT`}
        onSubmit={saveTrip}
        onSaveDraft={saveTrip}
        onGenerateInvoice={generateInvoice}
      />
    </div>
  );
}
