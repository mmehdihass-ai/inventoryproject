export { cn } from "cn"

const numberFormatter = new Intl.NumberFormat("en-AE")
const currencyFormatter = new Intl.NumberFormat("en-AE", {
  style: "currency",
  currency: "AED",
})

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—"
  return numberFormatter.format(value)
}

const quantityFormatter = new Intl.NumberFormat("en-AE", {
  maximumFractionDigits: 2,
})

export function formatQuantity(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—"
  return quantityFormatter.format(value)
}

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—"
  return currencyFormatter.format(value)
}

const compactNumberFormatter = new Intl.NumberFormat("en-AE", {
  notation: "compact",
  maximumFractionDigits: 1,
})

export function formatCompactNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—"
  return compactNumberFormatter.format(value)
}
