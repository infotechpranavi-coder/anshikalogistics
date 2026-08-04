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

export function calculateGrandTotal(fuelCost: number, expenseTotal: number): number {
  return round2((fuelCost || 0) + (expenseTotal || 0));
}

export function calculatePending(grandTotal: number, paidAmount: number): number {
  return round2(Math.max(0, (grandTotal || 0) - (paidAmount || 0)));
}

export interface TripCalculationInput {
  loadingKm: number;
  unloadingKm: number;
  mileage: number;
  dieselRate: number;
  fuelFilled?: number;
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
  const fuelCost = calculateFuelCost(fuelRequired, input.dieselRate);
  const expenseTotal = calculateExpenseTotal({
    toll: input.toll,
    parking: input.parking,
    food: input.food,
    repair: input.repair,
    policeFine: input.policeFine,
    advance: input.advance,
    miscExpense: input.miscExpense,
  });
  const grandTotal = calculateGrandTotal(fuelCost, expenseTotal);
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
