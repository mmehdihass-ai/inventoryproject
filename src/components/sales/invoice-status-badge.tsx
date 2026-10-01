import { Badge } from "@/components/ui/badge";
import {
  INVOICE_STATUS_LABEL,
  invoiceStatus,
  type InvoiceStatus,
} from "@/lib/types/sale";

const STATUS_CLASSNAME: Record<InvoiceStatus, string> = {
  UNPAID: "bg-rose-600 text-white",
  PARTIALLY_PAID: "bg-amber-600 text-white",
  PAID: "bg-emerald-600 text-white",
};

export function InvoiceStatusBadge({
  grandTotal,
  paidTotal,
}: {
  grandTotal: number;
  paidTotal: number;
}) {
  const status = invoiceStatus(grandTotal, paidTotal);
  return (
    <Badge className={STATUS_CLASSNAME[status]}>
      {INVOICE_STATUS_LABEL[status]}
    </Badge>
  );
}
