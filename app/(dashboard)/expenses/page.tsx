import { createExpense,deleteExpense,getExpenses } from "@/actions/expenses";
import { getDrivers } from "@/actions/drivers";
import { getTrips } from "@/actions/trips";
import { getVehicles } from "@/actions/vehicles";
import { PageHeader } from "@/components/shared/page-header";
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import { ExpenseForm } from "@/features/expenses/expense-form";
import { ExpensesTable } from "@/features/expenses/expenses-table";
export default async function ExpensesPage(){const [expenses,vehicles,drivers,trips]=await Promise.all([getExpenses(),getVehicles(),getDrivers({active:true}),getTrips({pageSize:100})]);async function remove(id:string){"use server";await deleteExpense(id)}return <div className="space-y-6"><PageHeader title="Expenses" description="Track general, trip, vehicle, and driver costs."/><div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]"><ExpensesTable data={expenses.data??[]} onDelete={remove}/><Card><CardHeader><CardTitle>Add expense</CardTitle></CardHeader><CardContent><ExpenseForm onSubmit={createExpense} vehicles={vehicles.data??[]} drivers={drivers.data??[]} trips={trips.data?.data??[]}/></CardContent></Card></div></div>}
