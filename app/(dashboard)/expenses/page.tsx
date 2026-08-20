import { createExpense, deleteExpense, getExpenses } from "@/actions/expenses";
import { getDrivers } from "@/actions/drivers";
import { getTrips } from "@/actions/trips";
import { getVehicles } from "@/actions/vehicles";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseForm } from "@/features/expenses/expense-form";
import { ExpensesTable } from "@/features/expenses/expenses-table";
import { Receipt } from "lucide-react";

export default async function ExpensesPage() {
  const [expenses, vehicles, drivers, trips] = await Promise.all([
    getExpenses(),
    getVehicles(),
    getDrivers({ active: true }),
    getTrips({ pageSize: 100 }),
  ]);

  async function remove(id: string) {
    "use server";
    await deleteExpense(id);
  }

  return (
    <div className="page-stack">
      <PageHeader
        badge="Finance"
        title="Expenses"
        description="Track general, trip, vehicle, and driver costs."
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <ExpensesTable data={expenses.data ?? []} onDelete={remove} />
        <Card className="h-fit overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-teal-50/30">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-teal-700" />
              Add expense
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ExpenseForm
              onSubmit={createExpense}
              vehicles={vehicles.data ?? []}
              drivers={drivers.data ?? []}
              trips={trips.data?.data ?? []}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
