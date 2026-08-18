import type {
  Role,
  VehicleStatus,
  FuelType,
  TripStatus,
  PaymentMethod,
  PaymentStatus,
  ExpenseType,
  ExpenseCategory,
  InvoiceStatus,
  NotificationType,
} from "@prisma/client";

export type {
  Role,
  VehicleStatus,
  FuelType,
  TripStatus,
  PaymentMethod,
  PaymentStatus,
  ExpenseType,
  ExpenseCategory,
  InvoiceStatus,
  NotificationType,
};

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardStats {
  todaysTrips: number;
  todaysExpense: number;
  todaysDieselCost: number;
  monthlyExpense: number;
  runningVehicles: number;
  completedTrips: number;
  pendingPayments: number;
  averageMileage: number;
  fuelConsumption: number;
  distanceTravelled: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface TripFormValues {
  vehicleId: string;
  vehicleNumber?: string;
  vehicleType?: string;
  owner?: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  fuelType?: string;
  tripDate: Date;
  tripTime?: string;
  source: string;
  destination: string;
  loadingKm: number;
  unloadingKm: number;
  isLoaded: boolean;
  isEmpty: boolean;
  remarks?: string;
  dieselRate: number;
  mileage: number;
  fuelFilled: number;
  acHours?: number;
  acLitresPerHour?: number;
  toll: number;
  parking: number;
  food: number;
  repair: number;
  policeFine: number;
  advance: number;
  miscExpense: number;
  voucherNumber?: string;
  narration?: string;
  paidAmount: number;
  paymentMethod?: PaymentMethod;
  status?: TripStatus;
}

export interface LiveInvoiceData {
  invoiceNumber: string;
  tripDate: Date | string;
  companyName: string;
  companyLogo?: string | null;
  companyAddress?: string | null;
  companyPhone?: string | null;
  companyEmail?: string | null;
  companyGst?: string | null;
  vehicleNumber: string;
  vehicleType: string;
  owner?: string;
  driverName?: string;
  driverPhone?: string;
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
  acHours?: number;
  acLitresPerHour?: number;
  acCharge?: number;
  toll: number;
  parking: number;
  food: number;
  repair: number;
  policeFine: number;
  advance: number;
  miscExpense: number;
  expenseTotal: number;
  grandTotal: number;
  paidAmount: number;
  pendingAmount: number;
  paymentMethod?: string;
  voucherNumber?: string;
  narration?: string;
  remarks?: string;
  extraExpenses?: { title: string; amount: number }[];
  signature?: string | null;
  upiId?: string | null;
  tripNumber?: string;
  isLoaded?: boolean;
  isEmpty?: boolean;
  bankName?: string | null;
  bankAccount?: string | null;
  bankIfsc?: string | null;
  bankBranch?: string | null;
}

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  ADMIN: ["*"],
  MANAGER: [
    "dashboard:read",
    "trips:*",
    "vehicles:*",
    "drivers:*",
    "invoices:*",
    "expenses:*",
    "reports:*",
    "settings:read",
    "users:read",
    "notifications:*",
  ],
  OPERATOR: [
    "dashboard:read",
    "trips:*",
    "vehicles:read",
    "drivers:read",
    "invoices:*",
    "expenses:*",
    "reports:read",
    "notifications:read",
  ],
  DRIVER: [
    "dashboard:read",
    "trips:read",
    "trips:create",
    "vehicles:read",
    "expenses:create",
    "expenses:read",
    "notifications:read",
    "profile:*",
  ],
};

export function hasPermission(role: Role, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role] || [];
  if (perms.includes("*")) return true;
  if (perms.includes(permission)) return true;
  const [resource] = permission.split(":");
  if (perms.includes(`${resource}:*`)) return true;
  return false;
}
