import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    companyName: z.string().min(2, "Company name is required"),
    phone: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const vehicleSchema = z.object({
  number: z.string().min(1, "Vehicle number is required"),
  type: z.string().min(1).default("Truck"),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.coerce.number().optional().nullable(),
  owner: z.string().optional(),
  fuelType: z.enum(["DIESEL", "PETROL", "CNG", "ELECTRIC", "HYBRID"]).default("DIESEL"),
  status: z.enum(["ACTIVE", "MAINTENANCE", "INACTIVE", "SOLD"]).default("ACTIVE"),
  mileage: z.coerce.number().min(0).default(0),
  capacity: z.coerce.number().optional().nullable(),
  insuranceNumber: z.string().optional(),
  insuranceExpiry: z.coerce.date().optional().nullable(),
  fitnessExpiry: z.coerce.date().optional().nullable(),
  permitExpiry: z.coerce.date().optional().nullable(),
  pollutionExpiry: z.coerce.date().optional().nullable(),
  chassisNumber: z.string().optional(),
  engineNumber: z.string().optional(),
  notes: z.string().optional(),
  currentDriverId: z.string().optional().nullable(),
});

export const driverSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  alternatePhone: z.string().optional(),
  licenseNumber: z.string().optional(),
  licenseExpiry: z.coerce.date().optional().nullable(),
  address: z.string().optional(),
  salary: z.coerce.number().min(0).default(0),
  joiningDate: z.coerce.date().optional().nullable(),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
});

export const tripSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  driverId: z.string().optional().nullable(),
  driverPhone: z.string().optional(),
  tripDate: z.coerce.date(),
  tripTime: z.string().optional(),
  source: z.string().min(1, "From is required"),
  destination: z.string().min(1, "To is required"),
  loadingKm: z.coerce.number().min(0).default(0),
  unloadingKm: z.coerce.number().min(0).default(0),
  distance: z.coerce.number().min(0).optional(),
  isLoaded: z.boolean().default(true),
  isEmpty: z.boolean().default(false),
  remarks: z.string().optional(),
  dieselRate: z.coerce.number().min(0).default(0),
  mileage: z.coerce.number().min(0).default(0),
  fuelFilled: z.coerce.number().min(0).default(0),
  fuelRequired: z.coerce.number().min(0).optional(),
  fuelCost: z.coerce.number().min(0).optional(),
  grandTotal: z.coerce.number().min(0).optional(),
  toll: z.coerce.number().min(0).default(0),
  parking: z.coerce.number().min(0).default(0),
  food: z.coerce.number().min(0).default(0),
  repair: z.coerce.number().min(0).default(0),
  policeFine: z.coerce.number().min(0).default(0),
  advance: z.coerce.number().min(0).default(0),
  miscExpense: z.coerce.number().min(0).default(0),
  voucherNumber: z.string().optional(),
  narration: z.string().optional(),
  paidAmount: z.coerce.number().min(0).default(0),
  paymentMethod: z.enum(["CASH", "UPI", "BANK", "CHEQUE"]).optional().nullable(),
  status: z.enum(["DRAFT", "PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).default("PENDING"),
  extraExpenses: z
    .array(
      z.object({
        title: z.string().trim().default(""),
        amount: z.coerce.number().min(0).default(0),
      })
    )
    .optional()
    .default([]),
});

export const expenseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  type: z.enum(["TRIP", "GENERAL", "VEHICLE", "DRIVER"]).default("GENERAL"),
  category: z
    .enum([
      "TOLL",
      "PARKING",
      "FOOD",
      "REPAIR",
      "POLICE_FINE",
      "ADVANCE",
      "MISC",
      "FUEL",
      "SALARY",
      "INSURANCE",
      "MAINTENANCE",
      "OTHER",
    ])
    .default("OTHER"),
  date: z.coerce.date().default(() => new Date()),
  description: z.string().optional(),
  tripId: z.string().optional().nullable(),
  vehicleId: z.string().optional().nullable(),
  driverId: z.string().optional().nullable(),
});

export const companySettingsSchema = z.object({
  name: z.string().min(2, "Company name is required"),
  logo: z.string().optional().nullable(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  country: z.string().default("India"),
  gst: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().optional(),
  invoicePrefix: z.string().min(1).default("INV"),
  invoiceStartingNumber: z.coerce.number().min(1).default(1),
  currency: z.string().default("INR"),
  timezone: z.string().default("Asia/Kolkata"),
  signature: z.string().optional().nullable(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  bankIfsc: z.string().optional(),
  upiId: z.string().optional(),
});

export const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(["ADMIN", "MANAGER", "OPERATOR", "DRIVER"]),
  isActive: z.boolean().default(true),
  password: z.string().min(6).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type VehicleInput = z.infer<typeof vehicleSchema>;
export type DriverInput = z.infer<typeof driverSchema>;
export type TripInput = z.infer<typeof tripSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type CompanySettingsInput = z.infer<typeof companySettingsSchema>;
export type UserInput = z.infer<typeof userSchema>;
