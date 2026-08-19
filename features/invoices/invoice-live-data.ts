import { APP_LOGO } from "@/lib/brand";
import type { LiveInvoiceData } from "@/types";
import { calculateAcCharge } from "@/utils/calculations";

type InvoiceLiveSource = {
  invoiceNumber: string;
  company: {
    name: string;
    logo?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    gst?: string | null;
    signature?: string | null;
    upiId?: string | null;
    bankName?: string | null;
    bankAccount?: string | null;
    bankIfsc?: string | null;
    bankBranch?: string | null;
  };
  trip: {
    tripNumber: string;
    tripDate: Date | string;
    source: string;
    destination: string;
    loadingKm: number;
    unloadingKm: number;
    distance: number;
    dieselRate: number;
    mileage: number;
    fuelFilled: number;
    fuelRequired: number;
    fuelCost: number;
    acHours?: number | null;
    acLitresPerHour?: number | null;
    remarks?: string | null;
    grandTotal: number;
    paidAmount: number;
    expenseTotal?: number | null;
    isLoaded?: boolean | null;
    isEmpty?: boolean | null;
    driverPhone?: string | null;
    voucherNumber?: string | null;
    vehicle: { number: string; type: string; owner?: string | null };
    driver?: { name: string; phone: string } | null;
    expenses?: { title: string; amount: number }[];
  };
};

export function invoiceToLiveData(invoice: InvoiceLiveSource): LiveInvoiceData {
  const { trip, company } = invoice;
  const extras = (trip.expenses ?? []).filter((item) => item.title.trim() && item.amount);
  const extraTotal = extras.reduce((sum, item) => sum + item.amount, 0);
  const acHours = trip.acHours ?? 0;
  const acLitresPerHour = trip.acLitresPerHour ?? 2;

  return {
    invoiceNumber: invoice.invoiceNumber,
    tripDate: trip.tripDate,
    companyName: company.name,
    companyLogo: company.logo || APP_LOGO,
    companyAddress: company.address,
    companyPhone: company.phone,
    companyEmail: company.email,
    companyGst: company.gst,
    vehicleNumber: trip.vehicle.number,
    vehicleType: trip.vehicle.type,
    owner: trip.vehicle.owner ?? undefined,
    driverName: trip.driver?.name,
    driverPhone: trip.driverPhone ?? trip.driver?.phone,
    source: trip.source,
    destination: trip.destination,
    loadingKm: trip.loadingKm,
    unloadingKm: trip.unloadingKm,
    distance: trip.distance,
    dieselRate: trip.dieselRate,
    mileage: trip.mileage,
    fuelFilled: trip.fuelFilled,
    fuelRequired: trip.fuelRequired,
    fuelCost: trip.fuelCost,
    acHours,
    acLitresPerHour,
    acCharge: calculateAcCharge(acHours, acLitresPerHour, trip.dieselRate),
    toll: 0,
    parking: 0,
    food: 0,
    repair: 0,
    policeFine: 0,
    advance: 0,
    miscExpense: extraTotal,
    expenseTotal: extraTotal,
    grandTotal: trip.grandTotal,
    paidAmount: trip.paidAmount,
    pendingAmount: trip.grandTotal - trip.paidAmount,
    voucherNumber: trip.voucherNumber ?? undefined,
    remarks: trip.remarks ?? undefined,
    extraExpenses: extras,
    signature: company.signature,
    upiId: company.upiId,
    tripNumber: trip.tripNumber,
    isLoaded: trip.isLoaded ?? true,
    isEmpty: trip.isEmpty ?? false,
    bankName: company.bankName,
    bankAccount: company.bankAccount,
    bankIfsc: company.bankIfsc,
    bankBranch: company.bankBranch,
  };
}
