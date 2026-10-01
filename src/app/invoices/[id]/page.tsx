import { notFound } from "next/navigation";
import { InvoiceDocument } from "@/components/invoice/invoice-document";
import { InvoiceToolbar } from "@/components/invoice/invoice-toolbar";
import { getInvoiceData } from "@/lib/invoice";

export default async function InvoicePage(
  props: PageProps<"/invoices/[id]">,
) {
  const { id } = await props.params;
  const data = await getInvoiceData(id);

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-full bg-neutral-100 print:bg-white">
      <InvoiceToolbar saleId={id} />
      <InvoiceDocument data={data} />
    </div>
  );
}
