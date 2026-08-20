"use client";

import { useState } from "react";
import { BarChart3, Download } from "lucide-react";
import {
  getDailyReport,
  getDriverReport,
  getExpenseReport,
  getFuelReport,
  getMonthlyReport,
  getPaymentReport,
  getVehicleReport,
} from "@/actions/reports";
import { ModernPanel } from "@/components/shared/modern-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { exportToCsv } from "@/lib/export";
import { formatCurrency } from "@/lib/utils";

type Row = Record<string, string | number | boolean | null | undefined>;
const loaders = {
  daily: getDailyReport,
  monthly: getMonthlyReport,
  vehicles: getVehicleReport,
  drivers: getDriverReport,
  expenses: getExpenseReport,
  fuel: getFuelReport,
  payments: getPaymentReport,
};
type Kind = keyof typeof loaders;

export function ReportsView() {
  const now = new Date();
  const month = new Date(now.getFullYear(), now.getMonth(), 1);
  const [kind, setKind] = useState<Kind>("daily");
  const [from, setFrom] = useState(month.toISOString().slice(0, 10));
  const [to, setTo] = useState(now.toISOString().slice(0, 10));
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run(next: Kind = kind) {
    setKind(next);
    setLoading(true);
    setError("");
    const result = await loaders[next]({ from, to });
    if (result.success) setRows((result.data ?? []) as Row[]);
    else setError("error" in result && result.error ? result.error : "Unable to load report.");
    setLoading(false);
  }

  const columns = rows.length ? Object.keys(rows[0]).filter((k) => k !== "id") : [];

  return (
    <div className="space-y-5">
      <ModernPanel
        title="Report filters"
        description="Choose a date range and report type"
        icon={BarChart3}
        action={
          rows.length > 0 ? (
            <Button
              variant="outline"
              className="border-slate-200 bg-white shadow-sm"
              onClick={() => exportToCsv(`${kind}-${from}-${to}.csv`, rows)}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          ) : null
        }
      >
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label>From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button onClick={() => void run()} disabled={loading} className="shadow-sm">
            {loading ? "Loading…" : "Generate"}
          </Button>
        </div>
      </ModernPanel>

      <Tabs value={kind} onValueChange={(v) => void run(v as Kind)}>
        <TabsList className="h-auto flex-wrap rounded-xl bg-slate-100/90 p-1 ring-1 ring-slate-200/80">
          {Object.keys(loaders).map((k) => (
            <TabsTrigger
              key={k}
              value={k}
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              {k[0].toUpperCase() + k.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="modern-table-shell">
        <table className="w-full min-w-[44rem] text-sm">
          <thead className="modern-table-head">
            <tr>
              {columns.map((c) => (
                <th className="px-4 py-3" key={c}>
                  {c.replace(/([A-Z])/g, " $1")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, i) => (
              <tr key={i} className="transition-colors hover:bg-slate-50/80">
                {columns.map((c) => (
                  <td className="px-4 py-3 text-slate-800" key={c}>
                    {typeof row[c] === "number" &&
                    /(cost|expense|revenue|paid|pending|amount|total)/i.test(c)
                      ? formatCurrency(row[c] as number)
                      : String(row[c] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && !loading ? (
          <p className="p-12 text-center text-sm text-slate-500">
            Select dates and generate a report.
          </p>
        ) : null}
      </div>
    </div>
  );
}
