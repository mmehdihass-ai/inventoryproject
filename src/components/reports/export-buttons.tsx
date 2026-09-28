"use client";

import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function ExportButtons({
  rows,
  filename,
}: {
  rows: Array<Record<string, string | number>>;
  filename: string;
}) {
  function exportCsv() {
    const csv = Papa.unparse(rows);
    downloadBlob(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
      `${filename}.csv`,
    );
  }

  function exportXlsx() {
    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Report");
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    downloadBlob(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `${filename}.xlsx`,
    );
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={exportCsv}
        disabled={rows.length === 0}
      >
        <Download className="h-4 w-4" />
        CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={exportXlsx}
        disabled={rows.length === 0}
      >
        <Download className="h-4 w-4" />
        Excel
      </Button>
    </div>
  );
}
