/**
 * Reusable trip/invoice calculation utilities.
 * All monetary values rounded to 2 decimal places.
 */

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateDistance(loadingKm: number, unloadingKm: number): number {
  const distance = (unloadingKm || 0) - (loadingKm || 0);
  return round2(Math.max(0, distance));
}

export function calculateFuelRequired(distance: number, mileage: number): number {
  if (!mileage || mileage <= 0) return 0;
  return round2(distance / mileage);
}

export function calculateFuelCost(fuelRequired: number, dieselRate: number): number {
  return round2((fuelRequired || 0) * (dieselRate || 0));
}

export interface ExpenseBreakdown {
  toll: number;
  parking: number;
  food: number;
  repair: number;
  policeFine: number;
  advance: number;
  miscExpense: number;
}

export function calculateExpenseTotal(expenses: ExpenseBreakdown): number {
  return round2(
    (expenses.toll || 0) +
      (expenses.parking || 0) +
      (expenses.food || 0) +
      (expenses.repair || 0) +
      (expenses.policeFine || 0) +
      (expenses.advance || 0) +
      (expenses.miscExpense || 0)
  );
}

export function calculateGrandTotal(entry: number, fuelCost: number, expenseTotal = 0): number {
  return round2((entry || 0) + (fuelCost || 0) + (expenseTotal || 0));
}

export function calculateTotalAmount(tripAmount: number, acCharge = 0): number {
  return round2((tripAmount || 0) + (acCharge || 0));
}

export function calculatePending(grandTotal: number, paidAmount: number): number {
  return round2((grandTotal || 0) - (paidAmount || 0));
}

export function calculatePendingLt(lt: number, paidLt: number, acLitres = 0): number {
  return round2((lt || 0) + (acLitres || 0) - (paidLt || 0));
}

export function formatLtWithAc(tripLt: number, acLitres = 0): string {
  const lt = round2(tripLt || 0).toFixed(2);
  const ac = round2(acLitres || 0);
  if (ac > 0) return `${lt} + ${ac.toFixed(2)} Ltr AC`;
  return lt;
}

export function calculateEntry(distance: number, isLoaded: boolean, isEmpty = false): number {
  const loaded = isEmpty ? false : isLoaded;
  if (!loaded) return 0;
  return round2(distance || 0);
}

export const DEFAULT_AC_LITRES_PER_HOUR = 2;

export function calculateAcLitres(
  hours: number,
  litresPerHour: number = DEFAULT_AC_LITRES_PER_HOUR
): number {
  return round2((hours || 0) * (litresPerHour || 0));
}

export function hoursBetweenTimes(start?: string, end?: string): number | null {
  if (!start || !end) return null;
  const parse = (value: string) => {
    const [hours, minutes] = value.split(":").map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    return hours * 60 + minutes;
  };
  const from = parse(start);
  const to = parse(end);
  if (from == null || to == null) return null;
  let mins = to - from;
  if (mins < 0) mins += 24 * 60;
  return round2(mins / 60);
}

/** Total AC usage from Start/End meter readings: End − Start */
export function readingDifference(
  start?: string | number | null,
  end?: string | number | null
): number | null {
  if (start === "" || start == null || end === "" || end == null) return null;
  const from = Number(start);
  const to = Number(end);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return null;
  return round2(Math.max(0, to - from));
}

export function calculateAcDieselAmount(
  acLitres: number,
  acPaidLt: number,
  dieselRate: number
): number {
  return calculateFuelCost((acLitres || 0) - (acPaidLt || 0), dieselRate);
}

export function calculateAcCharge(
  hours: number,
  litresPerHour: number,
  dieselRate: number,
  acPaidLt = 0
): number {
  return calculateAcDieselAmount(calculateAcLitres(hours, litresPerHour), acPaidLt, dieselRate);
}

export function calculateDieselAmount(
  pendingLt: number,
  dieselRate: number,
  _acHours = 0,
  _acLitresPerHour: number = DEFAULT_AC_LITRES_PER_HOUR
): number {
  return calculateFuelCost(pendingLt, dieselRate);
}

export interface TripCalculationInput {
  loadingKm: number;
  unloadingKm: number;
  mileage: number;
  dieselRate: number;
  fuelFilled?: number;
  isLoaded?: boolean;
  isEmpty?: boolean;
  acHours?: number;
  acLitresPerHour?: number;
  acPaidLt?: number;
  toll: number;
  parking: number;
  food: number;
  repair: number;
  policeFine: number;
  advance: number;
  miscExpense: number;
  paidAmount: number;
}

export interface TripCalculationResult {
  distance: number;
  fuelRequired: number;
  fuelCost: number;
  expenseTotal: number;
  grandTotal: number;
  pendingAmount: number;
}

export function calculateTripTotals(input: TripCalculationInput): TripCalculationResult {
  const distance = calculateDistance(input.loadingKm, input.unloadingKm);
  const fuelRequired = calculateFuelRequired(distance, input.mileage);
  const tripDieselLt = calculatePendingLt(fuelRequired, input.fuelFilled ?? 0, 0);
  const fuelCost = calculateDieselAmount(tripDieselLt, input.dieselRate);
  const acCharge = calculateAcCharge(
    input.acHours ?? 0,
    input.acLitresPerHour ?? DEFAULT_AC_LITRES_PER_HOUR,
    input.dieselRate,
    input.acPaidLt ?? 0
  );
  const expenseTotal = calculateExpenseTotal({
    toll: input.toll,
    parking: input.parking,
    food: input.food,
    repair: input.repair,
    policeFine: input.policeFine,
    advance: input.advance,
    miscExpense: input.miscExpense,
  });
  const entry = calculateEntry(distance, input.isLoaded ?? true, input.isEmpty);
  const tripAmount = calculateGrandTotal(entry, fuelCost, expenseTotal);
  const grandTotal = calculateTotalAmount(tripAmount, acCharge);
  const pendingAmount = calculatePending(grandTotal, input.paidAmount);

  return {
    distance,
    fuelRequired,
    fuelCost,
    expenseTotal,
    grandTotal,
    pendingAmount,
  };
}

export function calculateAverageMileage(
  totalDistance: number,
  totalFuel: number
): number {
  if (!totalFuel || totalFuel <= 0) return 0;
  return round2(totalDistance / totalFuel);
}

export function calculateProfit(revenue: number, expenses: number): number {
  return round2((revenue || 0) - (expenses || 0));
}
