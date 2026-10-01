"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, Download, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

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
import {
  checkExistingSkus,
  importProducts,
  type ImportSummary,
} from "@/lib/actions/products";
import {
  parseImportRow,
  isBlankRow,
  IMPORT_TEMPLATE_COLUMNS,
  IMPORT_TEMPLATE_EXAMPLE_ROW,
} from "@/lib/validation/product-import";

const ALREADY_EXISTS_MESSAGE =
  "Item already exists — use Stock In to update quantity";

type RowStatus = "new" | "exists" | "invalid";

type PreviewRow = {
  rowNumber: number;
  raw: Record<string, unknown>;
  sku: string | null;
  description: string;
  status: RowStatus;
  message?: string;
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
  const [isChecking, setIsChecking] = useState(false);
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
      if (!parsed.ok) {
        preview.push({
          rowNumber,
          raw: data,
          sku: parsed.sku,
          description: "",
          status: "invalid",
          message: parsed.error,
        });
        return;
      }
      if (seenSkus.has(parsed.sku)) {
        preview.push({
          rowNumber,
          raw: data,
          sku: parsed.sku,
          description: parsed.payload.description,
          status: "invalid",
          message: "Duplicate Item Number in this file",
        });
        return;
      }
      seenSkus.add(parsed.sku);
      preview.push({
        rowNumber,
        raw: data,
        sku: parsed.sku,
        description: parsed.payload.description,
        status: "new",
      });
    });

    setIsChecking(true);
    try {
      const candidateSkus = preview
        .filter((r) => r.status === "new" && r.sku)
        .map((r) => r.sku as string);
      const existing = new Set(await checkExistingSkus(candidateSkus));
      setRows(
        preview.map((row) =>
          row.sku && existing.has(row.sku)
            ? { ...row, status: "exists", message: ALREADY_EXISTS_MESSAGE }
            : row,
        ),
      );
    } finally {
      setIsChecking(false);
    }
  }

  async function handleImport() {
    const newRows = rows.filter((r) => r.status === "new");
    if (newRows.length === 0) return;
    setIsImporting(true);
    try {
      const result = await importProducts(
        newRows.map((r) => ({ rowNumber: r.rowNumber, raw: r.raw })),
      );
      setSummary(result);
      if (result.errors.length === 0) {
        toast.success(`Imported ${result.created} products`);
      } else {
        toast.warning("Import finished with some errors");
      }
      router.refresh();
    } finally {
      setIsImporting(false);
    }
  }

  const newCount = rows.filter((r) => r.status === "new").length;
  const existsCount = rows.filter((r) => r.status === "exists").length;
  const invalidCount = rows.filter((r) => r.status === "invalid").length;

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
            Only creates new products — one per new Item Number. An Item
            Number that already exists in the inventory is skipped entirely
            (its fields and stock are never changed by import); use Edit
            Product and Stock In/Adjustment for those instead. Opening Stock
            only applies to the brand-new products created here. Embedded
            images in the file are not imported as product photos.
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
              disabled={isChecking}
            >
              <Upload className="h-4 w-4" />
              Choose File
            </Button>
            {fileName && (
              <span className="text-sm text-muted-foreground">
                {fileName}
                {isChecking && " — checking existing items..."}
              </span>
            )}
          </div>

          {rows.length > 0 && (
            <>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {newCount} ready to import
                </span>
                {existsCount > 0 && (
                  <span className="flex items-center gap-1.5 text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    {existsCount} already exist
                  </span>
                )}
                {invalidCount > 0 && (
                  <span className="flex items-center gap-1.5 text-destructive">
                    <XCircle className="h-4 w-4" />
                    {invalidCount} invalid
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
                          {row.status === "new" && (
                            <span className="text-emerald-600">Ready</span>
                          )}
                          {row.status === "exists" && (
                            <span className="text-amber-600">
                              {row.message}
                            </span>
                          )}
                          {row.status === "invalid" && (
                            <span className="text-destructive">
                              {row.message}
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
                Created {summary.created}
                {summary.stockedIn > 0 &&
                  `, opening stock recorded for ${summary.stockedIn}`}
                {summary.skippedExisting > 0 &&
                  `. Skipped ${summary.skippedExisting} already-existing item(s)`}
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
            disabled={newCount === 0 || isImporting || isChecking}
          >
            {isImporting
              ? "Importing..."
              : `Import ${newCount || ""} Product${newCount === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
