import {
  COMPANY_NAME,
  COMPANY_INVOICE_INFO,
  COMPANY_BANK_INFO,
  PLACEHOLDER,
} from "@/lib/company";
import { INVOICE_STATUS_LABEL, invoiceStatus } from "@/lib/types/sale";
import { formatCurrency, formatQuantity } from "@/lib/utils";
import type { InvoiceData } from "@/lib/invoice";

const STATUS_CLASSNAME: Record<string, string> = {
  UNPAID: "border-rose-600 text-rose-600",
  PARTIALLY_PAID: "border-amber-600 text-amber-600",
  PAID: "border-emerald-600 text-emerald-600",
};

export function InvoiceDocument({ data }: { data: InvoiceData }) {
  const { sale, payments, paidTotal, balanceDue } = data;
  const status = invoiceStatus(sale.grand_total, paidTotal);

  return (
    <div className="mx-auto max-w-3xl bg-white p-10 text-sm text-neutral-900 print:p-0">
      <div className="flex items-start justify-between">
        <div>
          <div className="mb-2 flex h-14 w-14 items-center justify-center rounded border border-dashed border-neutral-300 text-[10px] text-neutral-400">
            LOGO
          </div>
          <p className="font-heading text-lg font-semibold">{COMPANY_NAME}</p>
          <p className="text-neutral-500">{COMPANY_INVOICE_INFO.email}</p>
          <p className="text-neutral-500">{COMPANY_INVOICE_INFO.phone}</p>
          <p className="max-w-xs text-neutral-500">
            {COMPANY_INVOICE_INFO.address}
          </p>
          <p className="text-neutral-500">
            TRN: {COMPANY_INVOICE_INFO.trn}
          </p>
        </div>
        <div className="text-right">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Tax Invoice
          </h1>
          <div className="mt-2 space-y-1 text-neutral-600">
            <p>
              <span className="text-neutral-400">Invoice No.</span>{" "}
              {sale.invoice_number}
            </p>
            <p>
              <span className="text-neutral-400">Invoice Date</span>{" "}
              {sale.sale_date}
            </p>
            {sale.delivery_note_number && (
              <p>
                <span className="text-neutral-400">Delivery Note</span>{" "}
                {sale.delivery_note_number}
              </p>
            )}
          </div>
          <span
            className={`mt-3 inline-block rounded border px-2 py-0.5 text-xs font-medium ${STATUS_CLASSNAME[status]}`}
          >
            {INVOICE_STATUS_LABEL[status]}
          </span>
        </div>
      </div>

      <div className="mt-8">
        <p className="text-xs font-medium tracking-wide text-neutral-400 uppercase">
          Billed To
        </p>
        <p className="font-medium">{sale.customer?.customer_name ?? "—"}</p>
        {sale.customer?.contact_person && <p>{sale.customer.contact_person}</p>}
        {sale.customer?.phone && (
          <p className="text-neutral-500">{sale.customer.phone}</p>
        )}
        {sale.customer?.email && (
          <p className="text-neutral-500">{sale.customer.email}</p>
        )}
        {sale.customer?.address && (
          <p className="text-neutral-500">{sale.customer.address}</p>
        )}
      </div>

      <table className="mt-6 w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-neutral-300 text-xs text-neutral-500">
            <th className="py-2 font-normal">Description</th>
            <th className="py-2 text-right font-normal">Qty</th>
            <th className="py-2 text-right font-normal">Unit Price</th>
            <th className="py-2 text-right font-normal">Tax</th>
            <th className="py-2 text-right font-normal">Amount</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item) => (
            <tr key={item.id} className="border-b border-neutral-100">
              <td className="py-2">
                {item.product
                  ? `${item.product.sku} — ${item.product.description}`
                  : "—"}
              </td>
              <td className="py-2 text-right">
                {formatQuantity(item.quantity)}
              </td>
              <td className="py-2 text-right">
                {formatCurrency(item.unit_price)}
              </td>
              <td className="py-2 text-right">
                {formatQuantity(sale.tax_percent)}%
              </td>
              <td className="py-2 text-right">
                {formatCurrency(item.line_total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex justify-between gap-8">
        <div className="max-w-xs text-neutral-500">
          {sale.notes && (
            <>
              <p className="text-xs font-medium tracking-wide text-neutral-400 uppercase">
                Notes
              </p>
              <p>{sale.notes}</p>
            </>
          )}
        </div>
        <div className="w-64 shrink-0 space-y-1">
          <Row label="Subtotal" value={formatCurrency(sale.total_amount)} />
          <Row
            label={`Tax (${formatQuantity(sale.tax_percent)}%)`}
            value={formatCurrency(sale.tax_amount)}
          />
          <Row
            label="Total"
            value={formatCurrency(sale.grand_total)}
            strong
          />
          <Row label="Amount Paid" value={formatCurrency(paidTotal)} />
          <Row
            label="Balance Due"
            value={formatCurrency(balanceDue)}
            strong
          />
        </div>
      </div>

      {payments.length > 0 && (
        <div className="mt-8">
          <p className="font-heading text-base font-semibold">
            Payments (Inv#{sale.invoice_number})
          </p>
          <table className="mt-2 w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-neutral-300 text-xs text-neutral-500">
                <th className="py-2 font-normal">#</th>
                <th className="py-2 font-normal">Price</th>
                <th className="py-2 font-normal">Payment Method</th>
                <th className="py-2 font-normal">Paid on</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment, index) => (
                <tr key={payment.id} className="border-b border-neutral-100">
                  <td className="py-2">{index + 1}</td>
                  <td className="py-2">{formatCurrency(payment.amount)}</td>
                  <td className="py-2">{payment.payment_method || "--"}</td>
                  <td className="py-2">{payment.paid_on}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 grid grid-cols-2 gap-8 text-neutral-500">
        <div>
          <p className="text-xs font-medium tracking-wide text-neutral-400 uppercase">
            Terms and Conditions
          </p>
          <p>Thank you for your business.</p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-neutral-400 uppercase">
            Bank Information
          </p>
          <p>Bank name: {COMPANY_BANK_INFO.bankName}</p>
          <p>Bank address: {COMPANY_BANK_INFO.bankAddress}</p>
          <p>Account name: {COMPANY_BANK_INFO.accountName}</p>
          <p>Account number: {COMPANY_BANK_INFO.accountNumber}</p>
          <p>IBAN: {COMPANY_BANK_INFO.iban}</p>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-2 gap-8 text-center text-neutral-500">
        <div className="border-t border-neutral-300 pt-1">
          Client signature
        </div>
        <div className="border-t border-neutral-300 pt-1">
          Business signature — {PLACEHOLDER}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between ${strong ? "border-t border-neutral-300 pt-1 font-semibold text-neutral-900" : "text-neutral-500"}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
