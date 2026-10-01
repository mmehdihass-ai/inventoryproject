import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import {
  COMPANY_NAME,
  COMPANY_INVOICE_INFO,
  COMPANY_BANK_INFO,
  PLACEHOLDER,
} from "@/lib/company";
import { INVOICE_STATUS_LABEL, invoiceStatus } from "@/lib/types/sale";
import { formatCurrency, formatQuantity } from "@/lib/utils";
import type { InvoiceData } from "@/lib/invoice";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, color: "#171717", fontFamily: "Helvetica" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  muted: { color: "#737373" },
  h1: { fontSize: 18, fontWeight: 700 },
  h2: { fontSize: 12, fontWeight: 700, marginBottom: 4 },
  logoBox: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#d4d4d4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
    fontSize: 9,
    alignSelf: "flex-end",
    marginTop: 6,
  },
  table: { marginTop: 16 },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#d4d4d4",
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
    paddingVertical: 4,
  },
  colDescription: { flex: 3 },
  colRight: { flex: 1, textAlign: "right" },
  totals: { width: 200, marginLeft: "auto", marginTop: 12 },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  totalsStrong: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
    borderTopWidth: 1,
    borderTopColor: "#d4d4d4",
    marginTop: 2,
    fontWeight: 700,
  },
  section: { marginTop: 20 },
});

const STATUS_COLOR: Record<string, string> = {
  UNPAID: "#e11d48",
  PARTIALLY_PAID: "#d97706",
  PAID: "#059669",
};

export function InvoicePdf({ data }: { data: InvoiceData }) {
  const { sale, payments, paidTotal, balanceDue } = data;
  const status = invoiceStatus(sale.grand_total, paidTotal);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.row}>
          <View>
            <View style={styles.logoBox}>
              <Text style={{ fontSize: 7, color: "#a3a3a3" }}>LOGO</Text>
            </View>
            <Text style={{ fontWeight: 700 }}>{COMPANY_NAME}</Text>
            <Text style={styles.muted}>{COMPANY_INVOICE_INFO.email}</Text>
            <Text style={styles.muted}>{COMPANY_INVOICE_INFO.phone}</Text>
            <Text style={[styles.muted, { maxWidth: 220 }]}>
              {COMPANY_INVOICE_INFO.address}
            </Text>
            <Text style={styles.muted}>TRN: {COMPANY_INVOICE_INFO.trn}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.h1}>Tax Invoice</Text>
            <Text style={{ marginTop: 6 }}>
              Invoice No. {sale.invoice_number}
            </Text>
            <Text>Invoice Date {sale.sale_date}</Text>
            {sale.delivery_note_number && (
              <Text>Delivery Note {sale.delivery_note_number}</Text>
            )}
            <Text
              style={[
                styles.badge,
                { borderColor: STATUS_COLOR[status], color: STATUS_COLOR[status] },
              ]}
            >
              {INVOICE_STATUS_LABEL[status]}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.muted, { fontSize: 8, marginBottom: 2 }]}>
            BILLED TO
          </Text>
          <Text style={{ fontWeight: 700 }}>
            {sale.customer?.customer_name ?? "—"}
          </Text>
          {sale.customer?.contact_person && (
            <Text>{sale.customer.contact_person}</Text>
          )}
          {sale.customer?.phone && (
            <Text style={styles.muted}>{sale.customer.phone}</Text>
          )}
          {sale.customer?.email && (
            <Text style={styles.muted}>{sale.customer.email}</Text>
          )}
          {sale.customer?.address && (
            <Text style={styles.muted}>{sale.customer.address}</Text>
          )}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colDescription, styles.muted]}>
              Description
            </Text>
            <Text style={[styles.colRight, styles.muted]}>Qty</Text>
            <Text style={[styles.colRight, styles.muted]}>Unit Price</Text>
            <Text style={[styles.colRight, styles.muted]}>Tax</Text>
            <Text style={[styles.colRight, styles.muted]}>Amount</Text>
          </View>
          {sale.items.map((item) => (
            <View style={styles.tableRow} key={item.id}>
              <Text style={styles.colDescription}>
                {item.product
                  ? `${item.product.sku} — ${item.product.description}`
                  : "—"}
              </Text>
              <Text style={styles.colRight}>
                {formatQuantity(item.quantity)}
              </Text>
              <Text style={styles.colRight}>
                {formatCurrency(item.unit_price)}
              </Text>
              <Text style={styles.colRight}>
                {formatQuantity(sale.tax_percent)}%
              </Text>
              <Text style={styles.colRight}>
                {formatCurrency(item.line_total)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalsRow}>
            <Text style={styles.muted}>Subtotal</Text>
            <Text>{formatCurrency(sale.total_amount)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.muted}>
              Tax ({formatQuantity(sale.tax_percent)}%)
            </Text>
            <Text>{formatCurrency(sale.tax_amount)}</Text>
          </View>
          <View style={styles.totalsStrong}>
            <Text>Total</Text>
            <Text>{formatCurrency(sale.grand_total)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.muted}>Amount Paid</Text>
            <Text>{formatCurrency(paidTotal)}</Text>
          </View>
          <View style={styles.totalsStrong}>
            <Text>Balance Due</Text>
            <Text>{formatCurrency(balanceDue)}</Text>
          </View>
        </View>

        {payments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.h2}>Payments (Inv#{sale.invoice_number})</Text>
            <View style={styles.tableHeaderRow}>
              <Text style={[{ flex: 0.5 }, styles.muted]}>#</Text>
              <Text style={[{ flex: 1 }, styles.muted]}>Price</Text>
              <Text style={[{ flex: 1.5 }, styles.muted]}>Payment Method</Text>
              <Text style={[{ flex: 1 }, styles.muted]}>Paid on</Text>
            </View>
            {payments.map((payment, index) => (
              <View style={styles.tableRow} key={payment.id}>
                <Text style={{ flex: 0.5 }}>{index + 1}</Text>
                <Text style={{ flex: 1 }}>
                  {formatCurrency(payment.amount)}
                </Text>
                <Text style={{ flex: 1.5 }}>
                  {payment.payment_method || "--"}
                </Text>
                <Text style={{ flex: 1 }}>{payment.paid_on}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={[styles.row, styles.section]}>
          <View style={{ maxWidth: 220 }}>
            <Text style={[styles.muted, { fontSize: 8, marginBottom: 2 }]}>
              TERMS AND CONDITIONS
            </Text>
            <Text style={styles.muted}>Thank you for your business.</Text>
          </View>
          <View>
            <Text style={[styles.muted, { fontSize: 8, marginBottom: 2 }]}>
              BANK INFORMATION
            </Text>
            <Text style={styles.muted}>
              Bank name: {COMPANY_BANK_INFO.bankName}
            </Text>
            <Text style={styles.muted}>
              Bank address: {COMPANY_BANK_INFO.bankAddress}
            </Text>
            <Text style={styles.muted}>
              Account name: {COMPANY_BANK_INFO.accountName}
            </Text>
            <Text style={styles.muted}>
              Account number: {COMPANY_BANK_INFO.accountNumber}
            </Text>
            <Text style={styles.muted}>IBAN: {COMPANY_BANK_INFO.iban}</Text>
          </View>
        </View>

        <View style={[styles.row, { marginTop: 48 }]}>
          <Text style={{ borderTopWidth: 1, borderTopColor: "#d4d4d4", paddingTop: 4, width: 200 }}>
            Client signature
          </Text>
          <Text style={{ borderTopWidth: 1, borderTopColor: "#d4d4d4", paddingTop: 4, width: 200, textAlign: "right" }}>
            Business signature — {PLACEHOLDER}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
