"use client";

import Link from "next/link";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InvoiceToolbar({ saleId }: { saleId: string }) {
  return (
    <div className="mx-auto flex max-w-3xl items-center justify-between py-4 print:hidden">
      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        render={<Link href={`/sales/${saleId}`} />}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Print
        </Button>
        <Button
          size="sm"
          nativeButton={false}
          render={<a href={`/api/invoices/${saleId}/pdf`} download />}
        >
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>
    </div>
  );
}
