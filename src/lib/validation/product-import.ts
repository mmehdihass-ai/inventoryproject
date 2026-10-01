import * as z from "zod";
import { productPayloadSchema, type ProductPayload } from "@/lib/validation/product";

export const IMPORT_TEMPLATE_COLUMNS = [
  "Vendor Name",
  "Item Number",
  "Model Number",
  "Description",
  "Product Category",
  "Size/Dimension",
  "Colour",
  "Unit",
  "PCS/CTN",
  "KG/CTN",
  "KG/Pallet",
  "SQM/CTN",
  "Cost Price",
  "Selling Price",
  "Reorder Level",
  "Opening Stock",
  "Notes",
];

export const IMPORT_TEMPLATE_EXAMPLE_ROW = [
  "ABC Trading LLC",
  "TILE-001",
  "MX-200",
  "Sample Ceramic Tile 60x60",
  "Tiles",
  "600x600mm",
  "White",
  "PCS",
  "4",
  "32",
  "1600",
  "1.44",
  "25.00",
  "35.00",
  "50",
  "100",
  "Imported from supplier catalog",
];

const HEADER_ALIASES: Record<string, string> = {
  "vendor name": "vendor_name",
  vendor: "vendor_name",
  "item number": "sku",
  sku: "sku",
  "model number": "model_number",
  description: "description",
  "product category": "category",
  category: "category",
  "size/dimension": "size_specification",
  size: "size_specification",
  colour: "colour",
  color: "colour",
  unit: "unit",
  "pcs/ctn": "pcs_per_carton",
  "kg/ctn": "kg_per_carton",
  "kg/pallet": "kg_per_pallet",
  "sqm/ctn": "sqm_per_carton",
  "cost price": "cost_price",
  "cost price (aed)": "cost_price",
  "selling price": "selling_price",
  "selling price (aed)": "selling_price",
  "reorder level": "reorder_level",
  "opening stock": "opening_stock",
  notes: "notes",
};

function normalizeRow(raw: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    const field = HEADER_ALIASES[key.trim().toLowerCase()];
    if (field) normalized[field] = value;
  }
  return normalized;
}

function cellToString(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function cellToNumber(value: unknown): number | null {
  const str = cellToString(value);
  if (str === "") return null;
  const n = Number(str);
  return Number.isNaN(n) ? null : n;
}

export function isBlankRow(raw: Record<string, unknown>): boolean {
  return Object.values(raw).every((v) => cellToString(v) === "");
}

// Fields an existing product can have updated from a re-imported sheet.
// sku is excluded (it's the match key, never re-set) and photo_url/active
// have no column at all — neither is ever touched by import.
const UPDATABLE_FIELD_KEYS: (keyof ProductPayload)[] = [
  "vendor_name",
  "model_number",
  "description",
  "category",
  "size_specification",
  "colour",
  "unit",
  "pcs_per_carton",
  "kg_per_carton",
  "kg_per_pallet",
  "sqm_per_carton",
  "cost_price",
  "selling_price",
  "reorder_level",
  "notes",
];

export type ImportRowResult =
  | {
      rowNumber: number;
      ok: true;
      sku: string;
      payload: ProductPayload;
      // Fields whose cell was non-blank in this row — used to build a
      // partial update for an existing product, so a blank cell means
      // "leave this field as it is", not "clear it".
      providedFields: (keyof ProductPayload)[];
      openingStock: number | null;
    }
  | { rowNumber: number; ok: false; sku: string | null; error: string };

export function parseImportRow(
  raw: Record<string, unknown>,
  rowNumber: number,
): ImportRowResult {
  const row = normalizeRow(raw);
  const sku = cellToString(row.sku);
  const description = cellToString(row.description);

  if (!sku) {
    return { rowNumber, ok: false, sku: null, error: "Item Number is required" };
  }
  if (!description) {
    return { rowNumber, ok: false, sku, error: "Description is required" };
  }

  const openingStock = cellToNumber(row.opening_stock);

  try {
    const payload = productPayloadSchema.parse({
      id: crypto.randomUUID(),
      sku,
      vendor_name: cellToString(row.vendor_name) || null,
      model_number: cellToString(row.model_number) || null,
      description,
      category: cellToString(row.category) || null,
      size_specification: cellToString(row.size_specification) || null,
      colour: cellToString(row.colour) || null,
      unit: cellToString(row.unit) || "PCS",
      pcs_per_carton: cellToNumber(row.pcs_per_carton),
      kg_per_carton: cellToNumber(row.kg_per_carton),
      kg_per_pallet: cellToNumber(row.kg_per_pallet),
      sqm_per_carton: cellToNumber(row.sqm_per_carton),
      cost_price: cellToNumber(row.cost_price),
      selling_price: cellToNumber(row.selling_price),
      reorder_level: cellToNumber(row.reorder_level) ?? 0,
      photo_url: null,
      notes: cellToString(row.notes) || null,
      active: true,
    });
    const providedFields = UPDATABLE_FIELD_KEYS.filter(
      (key) => cellToString(row[key]) !== "",
    );

    return {
      rowNumber,
      ok: true,
      sku,
      payload,
      providedFields,
      openingStock: openingStock && openingStock > 0 ? openingStock : null,
    };
  } catch (err) {
    const message =
      err instanceof z.ZodError
        ? (err.issues[0]?.message ?? "Invalid row")
        : "Invalid row";
    return { rowNumber, ok: false, sku, error: message };
  }
}
