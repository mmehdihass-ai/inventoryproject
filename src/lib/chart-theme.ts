// Fixed hex values matching the app's light-mode oklch tokens (globals.css).
// Recharts renders plain SVG attributes, which don't reliably resolve CSS
// custom properties, so chart marks use these resolved constants directly.
// The app has no dark-mode toggle wired up yet, so light-mode only for now.
export const CHART_COLORS = {
  mark: "#cb6440", // chart-1 / primary family — the one hue used for magnitude
  grid: "#ded6ce", // border — hairline gridlines, recessive
  axisText: "#6e6058", // muted-foreground — tick labels
  text: "#261d18", // foreground — tooltip/value text
  surface: "#fffdfa", // card — tooltip background, surface gap color
} as const;
