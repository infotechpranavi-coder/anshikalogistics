"use client";

import {
  Document,
  Image as PdfImage,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { INVOICE_LETTERHEAD } from "@/lib/brand";
import { amountInIndianWords, formatBillDate, formatCurrency, formatNumber } from "@/lib/utils";
import type { LiveInvoiceData } from "@/types";
import { calculateAcCharge, calculateAcLitres } from "@/utils/calculations";

const BORDER = "#737373";

const styles = StyleSheet.create({
  page: {
    padding: 16,
    fontFamily: "Times-Roman",
    fontSize: 8,
    color: "#111",
  },
  jurisdiction: { textAlign: "center", fontSize: 8, marginBottom: 6 },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  logoCol: { width: 80, alignItems: "flex-start" },
  logo: { width: 72, height: 58, objectFit: "contain" },
  headerCenter: { flexGrow: 1, alignItems: "center" },
  headerSpacer: { width: 80 },
  company: {
    fontFamily: "Times-Bold",
    fontSize: 22,
    color: "#b45309",
    textAlign: "center",
  },
  muted: { fontSize: 8, marginTop: 2, textAlign: "center" },
  gst: { fontSize: 8, fontFamily: "Times-Bold", marginTop: 2, textAlign: "center" },
  titleBar: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  title: { width: "70%", textAlign: "center", fontFamily: "Times-Bold", fontSize: 12 },
  original: { width: "15%", textAlign: "right", fontFamily: "Times-Bold", fontSize: 10 },
  titleSpacer: { width: "15%" },
  meta: { flexDirection: "row", borderWidth: 1, borderColor: BORDER, borderTopWidth: 0 },
  toBox: { width: "62%", padding: 8 },
  billBox: { width: "38%", padding: 8, borderLeftWidth: 1, borderLeftColor: BORDER },
  bold: { fontFamily: "Times-Bold" },
  table: { width: "100%", borderWidth: 1, borderColor: BORDER, borderTopWidth: 0 },
  row: { flexDirection: "row" },
  th: {
    backgroundColor: "#e5e5e5",
    fontFamily: "Times-Bold",
    textAlign: "center",
    paddingVertical: 3,
    paddingHorizontal: 2,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    fontSize: 7,
  },
  td: {
    textAlign: "center",
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    fontSize: 7,
  },
  footer: { flexDirection: "row", borderWidth: 1, borderColor: BORDER, borderTopWidth: 0 },
  words: { width: "62%", padding: 8 },
  totals: { width: "38%", borderLeftWidth: 1, borderLeftColor: BORDER },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  grand: { backgroundColor: "#e5e5e5" },
  bankWrap: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: BORDER,
    borderTopWidth: 0,
    padding: 8,
  },
  bankCol: { width: "62%", paddingRight: 10 },
  bankTable: { borderWidth: 1, borderColor: BORDER },
  bankRow: { flexDirection: "row", minHeight: 18 },
  bankLabel: {
    width: 108,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  bankLabelText: { fontFamily: "Times-Bold", color: "#b45309", fontSize: 8 },
  bankValue: {
    flexGrow: 1,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  bankValueText: { fontFamily: "Times-Bold", fontSize: 8 },
  termsTitle: { fontFamily: "Times-Bold", marginTop: 8, textDecoration: "underline" },
  termsLine: { marginTop: 2 },
  signCol: { width: "38%", alignItems: "flex-end" },
  qr: { width: 64, height: 64, marginBottom: 8 },
  signName: { fontFamily: "Times-Bold", color: "#b45309", textAlign: "right" },
  signLabel: { marginTop: 10, textAlign: "right" },
});

export interface InvoicePdfProps {
  data: LiveInvoiceData;
  qrUrl?: string | null;
}

function money(value: number) {
  return formatNumber(value);
}

export function InvoicePdfDocument({ data, qrUrl }: InvoicePdfProps) {
  const extras = (data.extraExpenses ?? []).filter((item) => item.title.trim());
  const acLitres = calculateAcLitres(data.acHours ?? 0, data.acLitresPerHour);
  const acCharge =
    data.acCharge ?? calculateAcCharge(data.acHours ?? 0, data.acLitresPerHour, data.dieselRate);
  const hasAc = (data.acHours ?? 0) > 0 || acCharge !== 0;
  const entry = Number.isFinite(Number(data.remarks)) ? Number(data.remarks) : 0;
  const dieselAmt = data.fuelCost;
  const extraTotal = extras.reduce((sum, item) => sum + item.amount, 0);
  const subTotal = dieselAmt + extraTotal;
  const totalFreight = data.grandTotal;
  const billTo = data.owner?.trim() || data.driverName || "—";
  const lrNo = data.tripNumber || data.invoiceNumber;
  const typeLabel = data.isEmpty ? "Empty" : "Loaded";
  const headers = [
    "Sr No.",
    "LR No",
    "Lr Date",
    "Truck No",
    "From City",
    "To City",
    "Type",
    "KM",
    "Lt",
    ...(hasAc ? ["AC Lt"] : []),
    "Entry",
    "Desil Amt",
    ...(hasAc ? ["AC Charge"] : []),
    ...extras.map((item) => item.title),
    "Sub Total",
    "Total Freight",
  ];
  const values = [
    "1",
    lrNo,
    formatBillDate(data.tripDate),
    data.vehicleNumber || "—",
    data.source || "—",
    data.destination || "—",
    typeLabel,
    formatNumber(data.distance),
    formatNumber(data.fuelRequired),
    ...(hasAc ? [formatNumber(acLitres)] : []),
    money(entry),
    money(dieselAmt),
    ...(hasAc ? [money(acCharge)] : []),
    ...extras.map((item) => money(item.amount)),
    money(subTotal),
    money(totalFreight),
  ];
  const colWidth = `${(100 / headers.length).toFixed(4)}%`;
  const logo = data.companyLogo?.startsWith("data:") ? data.companyLogo : null;
  const bankRows = [
    ["Bank Name :", data.bankName || "—"],
    ["Bank IFSC Code :", data.bankIfsc || "—"],
    ["Bank A/c No:", data.bankAccount || "—"],
    ["Bank Branch :", data.bankBranch || "—"],
  ] as const;

  return (
    <Document title={`Invoice ${data.invoiceNumber}`} author={data.companyName}>
      <Page size="A4" orientation="landscape" style={styles.page} wrap={false}>
        <Text style={styles.jurisdiction}>{INVOICE_LETTERHEAD.jurisdiction}</Text>
        <View style={styles.header}>
          <View style={styles.logoCol}>
            {logo ? <PdfImage src={logo} style={styles.logo} /> : null}
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.company}>{data.companyName || INVOICE_LETTERHEAD.name}</Text>
            <Text style={styles.muted}>{data.companyAddress || INVOICE_LETTERHEAD.address}</Text>
            <Text style={styles.muted}>
              Mob : {data.companyPhone || INVOICE_LETTERHEAD.phone}   Email :{" "}
              {data.companyEmail || INVOICE_LETTERHEAD.email}
            </Text>
            <Text style={styles.gst}>GSTNO. : {data.companyGst || INVOICE_LETTERHEAD.gst}</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.titleBar}>
          <Text style={styles.titleSpacer}> </Text>
          <Text style={styles.title}>Invoice</Text>
          <Text style={styles.original}>Original</Text>
        </View>

        <View style={styles.meta}>
          <View style={styles.toBox}>
            <Text style={styles.bold}>To,</Text>
            <Text style={[styles.bold, { fontSize: 11, marginTop: 4 }]}>{billTo}</Text>
            {data.driverPhone ? <Text>M : {data.driverPhone}</Text> : null}
            {data.vehicleType ? <Text>{data.vehicleType}</Text> : null}
          </View>
          <View style={styles.billBox}>
            <Text style={styles.bold}>BILL NO : {data.invoiceNumber}</Text>
            <Text style={styles.bold}>BILL DATE : {formatBillDate(data.tripDate)}</Text>
            <Text style={styles.bold}>HSN Code : 996511</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.row}>
            {headers.map((heading) => (
              <Text key={heading} style={[styles.th, { width: colWidth }]}>
                {heading}
              </Text>
            ))}
          </View>
          <View style={styles.row}>
            {values.map((value, index) => (
              <Text key={`${headers[index]}-${index}`} style={[styles.td, { width: colWidth }]}>
                {value}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.words}>
            <Text style={styles.bold}>Total Amount In Words :</Text>
            <Text>{amountInIndianWords(totalFreight)}</Text>
          </View>
          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text style={styles.bold}>Sub Total</Text>
              <Text>{formatCurrency(subTotal)}</Text>
            </View>
            <View style={[styles.totalRow, styles.grand, { borderBottomWidth: 0 }]}>
              <Text style={styles.bold}>Grand Total</Text>
              <Text style={styles.bold}>{formatCurrency(totalFreight)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.bankWrap}>
          <View style={styles.bankCol}>
            <View style={styles.bankTable}>
              {bankRows.map(([label, value], index) => (
                <View
                  key={label}
                  style={[
                    styles.bankRow,
                    index === bankRows.length - 1 ? { borderBottomWidth: 0 } : {},
                  ]}
                  wrap={false}
                >
                  <View
                    style={[
                      styles.bankLabel,
                      index === bankRows.length - 1 ? { borderBottomWidth: 0 } : {},
                    ]}
                  >
                    <Text style={styles.bankLabelText}>{label}</Text>
                  </View>
                  <View
                    style={[
                      styles.bankValue,
                      index === bankRows.length - 1 ? { borderBottomWidth: 0 } : {},
                    ]}
                  >
                    <Text style={styles.bankValueText}>{value}</Text>
                  </View>
                </View>
              ))}
            </View>
            <Text style={styles.termsTitle}>Terms & Condition</Text>
            <Text style={styles.termsLine}>1. Difference if any may be notified within 5 days of receipt.</Text>
            <Text style={styles.termsLine}>2. Please pay your bill amount within 15 days of receipt.</Text>
          </View>
          <View style={styles.signCol}>
            {qrUrl ? <PdfImage src={qrUrl} style={styles.qr} /> : null}
            <Text style={styles.signName}>For - {data.companyName || INVOICE_LETTERHEAD.name}</Text>
            {data.signature?.startsWith("data:") ? (
              <PdfImage src={data.signature} style={{ width: 80, height: 28, marginTop: 6 }} />
            ) : null}
            <Text style={styles.signLabel}>Authorised Signatory</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export default InvoicePdfDocument;
