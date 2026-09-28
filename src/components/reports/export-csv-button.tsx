"use client";

import Papa from "papaparse";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportCsvButton({
  rows,
  filename,
}: {
  rows: Array<Record<string, string | number>>;
  filename: string;
}) {
  function handleExport() {
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={rows.length === 0}
    >
      <Download className="h-4 w-4" />
      Export CSV
    </Button>
  );
}
