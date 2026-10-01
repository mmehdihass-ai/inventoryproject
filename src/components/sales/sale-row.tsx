"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Printer, Download } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { InvoiceStatusBadge } from "@/components/sales/invoice-status-badge";
import { RecordPaymentDialog } from "@/components/sales/record-payment-dialog";
import { formatCurrency } from "@/lib/utils";
import type { SaleListRow } from "@/lib/queries/sales";
import type { Payment } from "@/lib/types/sale";

export function SaleRow({
  sale,
  payments,
  showCustomer,
}: {
  sale: SaleListRow;
  payments: Payment[];
  showCustomer: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const paidTotal = payments.reduce((sum, p) => sum + p.amount, 0);
  const balanceDue = sale.grand_total - paidTotal;
  const columnCount = showCustomer ? 6 : 5;

  return (
    <>
      <TableRow className="cursor-pointer" onClick={() => setExpanded((v) => !v)}>
        <TableCell className="w-8">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </TableCell>
        <TableCell>{sale.sale_date}</TableCell>
        <TableCell className="font-medium">
          <Link
            href={`/sales/${sale.id}`}
            className="hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {sale.invoice_number}
          </Link>
        </TableCell>
        {showCustomer && (
          <TableCell>{sale.customer?.customer_name ?? "—"}</TableCell>
        )}
        <TableCell className="text-right font-medium">
          {formatCurrency(sale.grand_total)}
        </TableCell>
        <TableCell>
          <InvoiceStatusBadge grandTotal={sale.grand_total} paidTotal={paidTotal} />
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              nativeButton={false}
              render={
                <Link href={`/invoices/${sale.id}`} target="_blank" />
              }
            >
              <Printer className="h-4 w-4" />
              <span className="sr-only">Print {sale.invoice_number}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              nativeButton={false}
              render={
                <a href={`/api/invoices/${sale.id}/pdf`} download />
              }
            >
              <Download className="h-4 w-4" />
              <span className="sr-only">Download {sale.invoice_number}</span>
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {expanded && (
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell colSpan={columnCount + 1} className="py-3">
            <div className="space-y-2 pl-8">
              {payments.length > 0 && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground">
                      <th className="pb-1 text-left font-normal">#</th>
                      <th className="pb-1 text-left font-normal">Amount</th>
                      <th className="pb-1 text-left font-normal">Method</th>
                      <th className="pb-1 text-left font-normal">Paid on</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment, index) => (
                      <tr key={payment.id}>
                        <td className="py-0.5">{index + 1}</td>
                        <td className="py-0.5">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="py-0.5 text-muted-foreground">
                          {payment.payment_method || "—"}
                        </td>
                        <td className="py-0.5">{payment.paid_on}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-medium">
                  Balance due: {formatCurrency(balanceDue)}
                </span>
                <RecordPaymentDialog
                  saleId={sale.id}
                  invoiceNumber={sale.invoice_number}
                  balanceDue={balanceDue}
                />
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
