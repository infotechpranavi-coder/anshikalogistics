"use client";

import {
  Document,
  Image as PdfImage,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { LiveInvoiceData } from "@/types";
import { resolveLogoUrl } from "@/lib/brand";

const styles = StyleSheet.create({
  page: { padding: 34, color: "#0f172a", fontFamily: "Helvetica", fontSize: 9 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: "#1e293b",
    paddingBottom: 14,
  },
  brand: { flexDirection: "row", gap: 10, width: "68%" },
  logo: { width: 72, height: 72, objectFit: "contain" },
  companyName: { fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  muted: { color: "#64748b", lineHeight: 1.4 },
  invoice: { textAlign: "right" },
  invoiceLabel: { color: "#64748b", letterSpacing: 2, fontSize: 8 },
  invoiceNumber: { fontSize: 14, fontFamily: "Helvetica-Bold", marginVertical: 3 },
  twoColumns: { flexDirection: "row", gap: 18, marginTop: 14 },
  column: { flex: 1 },
  label: {
    color: "#94a3b8",
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  value: { fontFamily: "Helvetica-Bold", fontSize: 10, marginBottom: 2 },
  route: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  table: { borderWidth: 1, borderColor: "#e2e8f0" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    paddingHorizontal: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  totals: {
    marginTop: 16,
    marginLeft: "55%",
    borderTopWidth: 2,
    borderTopColor: "#1e293b",
    paddingTop: 8,
  },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  grandTotal: { fontFamily: "Helvetica-Bold", fontSize: 11 },
  footer: {
    marginTop: "auto",
    paddingTop: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  signature: { width: 90, height: 35, objectFit: "contain", marginLeft: "auto" },
  signatureLine: {
    width: 110,
    borderTopWidth: 1,
    borderTopColor: "#64748b",
    paddingTop: 4,
    textAlign: "center",
  },
});

const money = (amount: number) =>
  `INR ${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0)}`;

const date = (value: Date | string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const expenses: Array<[keyof LiveInvoiceData, string]> = [
  ["toll", "Toll"],
  ["parking", "Parking"],
  ["food", "Food"],
  ["repair", "Repair"],
  ["policeFine", "Police fine"],
  ["advance", "Advance"],
  ["miscExpense", "Miscellaneous"],
];

export interface InvoicePdfProps {
  data: LiveInvoiceData;
}

export function InvoicePdfDocument({ data }: InvoicePdfProps) {
  return (
    <Document title={`Invoice ${data.invoiceNumber}`} author={data.companyName}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <PdfImage src={resolveLogoUrl(data.companyLogo)} style={styles.logo} />
            <View>
              <Text style={styles.companyName}>{data.companyName}</Text>
              {data.companyAddress ? <Text style={styles.muted}>{data.companyAddress}</Text> : null}
              <Text style={styles.muted}>
                {[data.companyPhone, data.companyEmail].filter(Boolean).join(" | ")}
              </Text>
              {data.companyGst ? <Text style={styles.muted}>GST: {data.companyGst}</Text> : null}
            </View>
          </View>
          <View style={styles.invoice}>
            <Text style={styles.invoiceLabel}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{data.invoiceNumber}</Text>
            <Text style={styles.muted}>{date(data.tripDate)}</Text>
          </View>
        </View>

        <View style={styles.twoColumns}>
          <InfoBlock
            label="VEHICLE"
            value={data.vehicleNumber || "—"}
            detail={[data.vehicleType, data.owner].filter(Boolean).join(" | ") || "—"}
          />
          <InfoBlock
            label="DRIVER"
            value={data.driverName || "—"}
            detail={data.driverPhone || "—"}
          />
        </View>

        <View style={styles.route}>
          <Text>{data.source || "Source"}</Text>
          <Text style={styles.muted}>TO</Text>
          <Text>{data.destination || "Destination"}</Text>
        </View>

        <View style={styles.twoColumns}>
          <Table
            title="DISTANCE"
            rows={[
              ["Loading KM", `${data.loadingKm.toFixed(2)} km`],
              ["Unloading KM", `${data.unloadingKm.toFixed(2)} km`],
              ["Distance", `${data.distance.toFixed(2)} km`],
            ]}
          />
          <Table
            title="FUEL"
            rows={[
              ["Rate", money(data.dieselRate)],
              ["Mileage", `${data.mileage.toFixed(2)} km/l`],
              ["Filled", `${data.fuelFilled.toFixed(2)} l`],
              ["Required", `${data.fuelRequired.toFixed(2)} l`],
              ["Fuel cost", money(data.fuelCost)],
            ]}
          />
        </View>

        <View style={{ marginTop: 18 }}>
          <Text style={styles.label}>CHARGES</Text>
          <View style={styles.table}>
            <PdfRow label="Fuel cost" value={money(data.fuelCost)} />
            {expenses
              .filter(([key]) => Number(data[key]) > 0)
              .map(([key, label]) => (
                <PdfRow key={key} label={label} value={money(Number(data[key]))} />
              ))}
          </View>
        </View>

        <View style={styles.totals}>
          <PdfRow label="Grand total" value={money(data.grandTotal)} strong />
        </View>

        <View style={styles.footer}>
          <View style={{ maxWidth: "58%" }}>
            {data.upiId ? <Text style={styles.muted}>UPI: {data.upiId}</Text> : null}
            {data.remarks ? <Text style={styles.muted}>Remarks: {data.remarks}</Text> : null}
            <Text style={[styles.muted, { marginTop: 8 }]}>Thank you for your business.</Text>
          </View>
          <View>
            {data.signature ? <PdfImage src={data.signature} style={styles.signature} /> : null}
            <Text style={styles.signatureLine}>Authorized signature</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

function InfoBlock({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <View style={styles.column}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.muted}>{detail}</Text>
    </View>
  );
}

function Table({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <View style={styles.column}>
      <Text style={styles.label}>{title}</Text>
      <View style={styles.table}>
        {rows.map(([label, value]) => (
          <PdfRow key={label} label={label} value={value} />
        ))}
      </View>
    </View>
  );
}

function PdfRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={strong ? styles.grandTotal : undefined}>{label}</Text>
      <Text style={strong ? styles.grandTotal : undefined}>{value}</Text>
    </View>
  );
}

export default InvoicePdfDocument;
