"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, Download, CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { importProducts, type ImportSummary } from "@/lib/actions/products";
import {
  parseImportRow,
  isBlankRow,
  IMPORT_TEMPLATE_COLUMNS,
  IMPORT_TEMPLATE_EXAMPLE_ROW,
} from "@/lib/validation/product-import";

type PreviewRow = {
  rowNumber: number;
  raw: Record<string, unknown>;
  sku: string | null;
  description: string;
  ok: boolean;
  error?: string;
};

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadTemplate() {
  const sheet = XLSX.utils.aoa_to_sheet([
    IMPORT_TEMPLATE_COLUMNS,
    IMPORT_TEMPLATE_EXAMPLE_ROW,
  ]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Products");
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  downloadBlob(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    "product-import-template.xlsx",
  );
}

export function ProductImportDialog() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  function reset() {
    setFileName(null);
    setRows([]);
    setSummary(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleFile(file: File) {
    setSummary(null);
    setFileName(file.name);
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });

    const seenSkus = new Set<string>();
    const preview: PreviewRow[] = [];
    raw.forEach((data, index) => {
      if (isBlankRow(data)) return;
      const rowNumber = index + 2; // header is row 1
      const parsed = parseImportRow(data, rowNumber);
      if (parsed.ok) {
        if (seenSkus.has(parsed.sku)) {
          preview.push({
            rowNumber,
            raw: data,
            sku: parsed.sku,
            description: parsed.payload.description,
            ok: false,
            error: "Duplicate Item Number in this file",
          });
          return;
        }
        seenSkus.add(parsed.sku);
        preview.push({
          rowNumber,
          raw: data,
          sku: parsed.sku,
          description: parsed.payload.description,
          ok: true,
        });
      } else {
        preview.push({
          rowNumber,
          raw: data,
          sku: parsed.sku,
          description: "",
          ok: false,
          error: parsed.error,
        });
      }
    });
    setRows(preview);
  }

  async function handleImport() {
    const validRows = rows.filter((r) => r.ok);
    if (validRows.length === 0) return;
    setIsImporting(true);
    try {
      const result = await importProducts(
        validRows.map((r) => ({ rowNumber: r.rowNumber, raw: r.raw })),
      );
      setSummary(result);
      if (result.errors.length === 0) {
        toast.success(
          `Imported ${result.created + result.updated} products`,
        );
      } else {
        toast.warning("Import finished with some errors");
      }
      router.refresh();
    } finally {
      setIsImporting(false);
    }
  }

  const validCount = rows.filter((r) => r.ok).length;
  const invalidCount = rows.length - validCount;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <FileSpreadsheet className="h-4 w-4" />
        Import
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] w-full flex-col overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Import Products</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Creates a new product for each new Item Number, or updates the
            matching existing product otherwise — a blank cell on an
            existing product leaves that field as it is, it won&apos;t clear
            it. Opening Stock only applies to brand-new products — to adjust
            an existing product&apos;s stock, use Stock In or Adjustment
            instead. Embedded images in the file are not imported as product
            photos.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
            >
              <Download className="h-4 w-4" />
              Download Template
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            <Button
              type="button"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Choose File
            </Button>
            {fileName && (
              <span className="text-sm text-muted-foreground">{fileName}</span>
            )}
          </div>

          {rows.length > 0 && (
            <>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {validCount} ready to import
                </span>
                {invalidCount > 0 && (
                  <span className="flex items-center gap-1.5 text-destructive">
                    <XCircle className="h-4 w-4" />
                    {invalidCount} skipped
                  </span>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14">Row</TableHead>
                      <TableHead>Item Number</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.rowNumber}>
                        <TableCell className="text-muted-foreground">
                          {row.rowNumber}
                        </TableCell>
                        <TableCell className="font-medium">
                          {row.sku || "—"}
                        </TableCell>
                        <TableCell>{row.description || "—"}</TableCell>
                        <TableCell>
                          {row.ok ? (
                            <span className="text-emerald-600">Ready</span>
                          ) : (
                            <span className="text-destructive">
                              {row.error}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {summary && (
            <div className="space-y-1 rounded-md border bg-muted/30 p-3 text-sm">
              <p>
                Created {summary.created}, updated {summary.updated}
                {summary.stockedIn > 0 &&
                  `, opening stock recorded for ${summary.stockedIn}`}
                .
              </p>
              {summary.errors.map((e) => (
                <p key={e.rowNumber} className="text-destructive">
                  Row {e.rowNumber} ({e.sku ?? "—"}): {e.message}
                </p>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={handleImport}
            disabled={validCount === 0 || isImporting}
          >
            {isImporting
              ? "Importing..."
              : `Import ${validCount || ""} Product${validCount === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
