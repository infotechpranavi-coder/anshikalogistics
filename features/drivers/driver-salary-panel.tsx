"use client";

import { useEffect, useMemo, useState } from "react";
import { IndianRupee, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteDriverSalaryPayment,
  getDriverSalaryPayments,
  recordDriverSalaryPayment,
} from "@/actions/driver-salaries";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils";

export interface DriverSalaryTarget {
  id: string;
  name: string;
  salary: number;
}

type SalaryPayment = {
  id: string;
  month: string;
  paidDate: Date | string;
  amount: number;
  notes: string | null;
};

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function todayValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function toDateInput(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return todayValue();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function formatMonthLabel(month: string) {
  const [year, monthPart] = month.split("-").map(Number);
  if (!year || !monthPart) return month;
  return new Date(year, monthPart - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

export function DriverSalaryPanel({
  driver,
  open,
  onOpenChange,
}: {
  driver: DriverSalaryTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [payments, setPayments] = useState<SalaryPayment[]>([]);
  const [defaultSalary, setDefaultSalary] = useState(0);
  const [month, setMonth] = useState(currentMonthValue());
  const [paidDate, setPaidDate] = useState(todayValue());
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !driver) return;

    let cancelled = false;
    setLoading(true);
    setMonth(currentMonthValue());
    setPaidDate(todayValue());
    setNotes("");
    setAmount(driver.salary > 0 ? String(driver.salary) : "");

    void getDriverSalaryPayments(driver.id).then((result) => {
      if (cancelled) return;
      if (!result.success || !result.data) {
        toast.error(result.error ?? "Unable to load salary history.");
        setPayments([]);
        setLoading(false);
        return;
      }
      setPayments(result.data.payments);
      setDefaultSalary(result.data.driver.salary);
      if (result.data.driver.salary > 0) {
        setAmount(String(result.data.driver.salary));
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [open, driver]);

  const existingForMonth = useMemo(
    () => payments.find((payment) => payment.month === month) ?? null,
    [payments, month]
  );

  useEffect(() => {
    if (!open || !driver) return;
    if (existingForMonth) {
      setPaidDate(toDateInput(existingForMonth.paidDate));
      setAmount(String(existingForMonth.amount));
      setNotes(existingForMonth.notes ?? "");
      return;
    }
    setPaidDate(todayValue());
    setAmount(defaultSalary > 0 ? String(defaultSalary) : driver.salary > 0 ? String(driver.salary) : "");
    setNotes("");
  }, [existingForMonth, open, driver, defaultSalary]);

  async function handleSave() {
    if (!driver) return;
    setSaving(true);
    const result = await recordDriverSalaryPayment({
      driverId: driver.id,
      month,
      paidDate: new Date(paidDate),
      amount: Number(amount),
      notes: notes.trim() || undefined,
    });
    setSaving(false);

    if (!result.success) {
      toast.error(result.error ?? "Unable to save salary payment.");
      return;
    }

    toast.success(
      existingForMonth
        ? `Updated salary for ${formatMonthLabel(month)}.`
        : `Salary marked paid for ${formatMonthLabel(month)}.`
    );

    const refreshed = await getDriverSalaryPayments(driver.id);
    if (refreshed.success && refreshed.data) {
      setPayments(refreshed.data.payments);
    }
  }

  async function handleDelete(paymentId: string) {
    if (!confirm("Delete this salary payment record?")) return;
    setDeletingId(paymentId);
    const result = await deleteDriverSalaryPayment(paymentId);
    setDeletingId(null);
    if (!result.success) {
      toast.error(result.error ?? "Unable to delete salary payment.");
      return;
    }
    setPayments((current) => current.filter((item) => item.id !== paymentId));
    toast.success("Salary payment deleted.");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-xl gap-0 overflow-hidden rounded-2xl border-slate-200/80 bg-white p-0 text-slate-900 shadow-2xl">
        <DialogHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-teal-50/30 px-5 py-3">
          <DialogTitle className="flex items-center gap-2 text-base">
            <IndianRupee className="h-4 w-4 text-teal-700" />
            Salary — {driver?.name ?? "Driver"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Record month, paid date, and amount. History lists every month paid.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 overflow-y-auto px-5 py-3">
          <div className="grid gap-2.5 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs">Salary month</Label>
              <Input
                type="month"
                className="h-9"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Paid date</Label>
              <Input
                type="date"
                className="h-9"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Amount paid</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                className="h-9"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={defaultSalary ? String(defaultSalary) : "0"}
              />
            </div>
            <div className="space-y-1 sm:col-span-3">
              <Label className="text-xs">Notes (optional)</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-9"
                placeholder="Advance adjusted, cash/UPI, etc."
              />
            </div>
          </div>

          {existingForMonth ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800">
              Salary for {formatMonthLabel(month)} already recorded — saving updates that month.
            </p>
          ) : null}

          <Button
            type="button"
            size="sm"
            className="shadow-sm"
            disabled={saving || !amount || Number(amount) <= 0 || !month || !paidDate}
            onClick={() => void handleSave()}
          >
            {saving
              ? "Saving…"
              : existingForMonth
                ? "Update month salary"
                : "Mark salary paid"}
          </Button>

          <div className="space-y-1.5 border-t border-slate-100 pt-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Monthly salary history
            </h3>
            <div className="max-h-40 overflow-auto rounded-xl border border-slate-200/80 bg-white">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-50 text-left uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Month</th>
                    <th className="px-3 py-2">Paid date</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">Notes</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-slate-500">
                        Loading…
                      </td>
                    </tr>
                  ) : payments.length ? (
                    payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-slate-50/80">
                        <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-900">
                          {formatMonthLabel(payment.month)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2">{formatDate(payment.paidDate)}</td>
                        <td className="whitespace-nowrap px-3 py-2 font-semibold text-teal-800">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="max-w-36 truncate px-3 py-2 text-slate-600">
                          {payment.notes || "—"}
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-red-600"
                            disabled={deletingId === payment.id}
                            onClick={() => void handleDelete(payment.id)}
                            aria-label="Delete salary payment"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-slate-500">
                        No salary payments yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
