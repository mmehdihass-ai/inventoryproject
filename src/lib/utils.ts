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

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—"
  return currencyFormatter.format(value)
}
