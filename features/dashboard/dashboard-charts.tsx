"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import type { DashboardChartPoint } from "@/actions/dashboard";

interface DashboardChartsProps {
  monthlyExpenses: DashboardChartPoint[];
  fuelConsumption: DashboardChartPoint[];
  expenseBreakdown: DashboardChartPoint[];
  tripsPerMonth: DashboardChartPoint[];
  vehicleUsage: DashboardChartPoint[];
}

const pieColors = [
  "#0f766e",
  "#059669",
  "#0891b2",
  "#475569",
  "#14b8a6",
  "#10b981",
  "#64748b",
  "#0e7490",
  "#34d399",
  "#94a3b8",
];

const axisProps = {
  axisLine: false,
  tickLine: false,
  tick: { fill: "#64748b", fontSize: 12 },
};

export function DashboardCharts({
  monthlyExpenses,
  fuelConsumption,
  expenseBreakdown,
  tripsPerMonth,
  vehicleUsage,
}: DashboardChartsProps) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <ChartCard title="Monthly expenses" className="lg:col-span-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={monthlyExpenses} margin={{ top: 8, right: 8, left: 8 }}>
            <defs>
              <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0f766e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0f766e" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" {...axisProps} />
            <YAxis
              {...axisProps}
              width={76}
              tickFormatter={(value) => compactCurrency(Number(value))}
            />
            <Tooltip
              formatter={(value) => [formatCurrency(Number(value)), "Expenses"]}
              contentStyle={tooltipStyle}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#0f766e"
              strokeWidth={2.5}
              fill="url(#expenseFill)"
              activeDot={{ r: 5, fill: "#0f766e", stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Fuel consumption">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={fuelConsumption} margin={{ top: 8, right: 8, left: 0 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" {...axisProps} />
            <YAxis {...axisProps} width={48} />
            <Tooltip
              formatter={(value) => [`${Number(value).toLocaleString("en-IN")} L`, "Fuel"]}
              contentStyle={tooltipStyle}
              cursor={{ fill: "#f1f5f9" }}
            />
            <Bar dataKey="value" fill="#0891b2" radius={[5, 5, 0, 0]} maxBarSize={42} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Expense breakdown">
        {expenseBreakdown.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={expenseBreakdown}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="48%"
                innerRadius={58}
                outerRadius={92}
                paddingAngle={2}
              >
                {expenseBreakdown.map((entry, index) => (
                  <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={tooltipStyle}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <ChartEmpty />
        )}
      </ChartCard>

      <ChartCard title="Trips per month">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={tripsPerMonth} margin={{ top: 8, right: 8, left: 0 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" {...axisProps} />
            <YAxis {...axisProps} width={36} allowDecimals={false} />
            <Tooltip
              formatter={(value) => [Number(value), "Trips"]}
              contentStyle={tooltipStyle}
              cursor={{ fill: "#f1f5f9" }}
            />
            <Bar dataKey="value" fill="#059669" radius={[5, 5, 0, 0]} maxBarSize={42} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Vehicle usage">
        {vehicleUsage.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={vehicleUsage}
              layout="vertical"
              margin={{ top: 8, right: 18, left: 14 }}
            >
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" {...axisProps} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                {...axisProps}
                width={88}
                tick={{ fill: "#475569", fontSize: 11 }}
              />
              <Tooltip
                formatter={(value) => [Number(value), "Trips"]}
                contentStyle={tooltipStyle}
                cursor={{ fill: "#f1f5f9" }}
              />
              <Bar dataKey="value" fill="#475569" radius={[0, 5, 5, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ChartEmpty />
        )}
      </ChartCard>
    </div>
  );
}

function ChartCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-teal-50/30 pb-4">
        <CardTitle className="text-base text-slate-900">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-72 px-3 pb-5 sm:px-5">{children}</CardContent>
    </Card>
  );
}

function ChartEmpty() {
  return (
    <div className="grid h-full place-items-center text-sm text-slate-500">
      No data available for this period.
    </div>
  );
}

const tooltipStyle = {
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
};

function compactCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
