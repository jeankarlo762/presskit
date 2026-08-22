/**
 * A curated, finite list rather than free-text font entry — lets apps/site
 * load every option through next/font/google at build time (self-hosted,
 * no runtime request to Google, no layout-shift/FOUC surprises) while still
 * giving the artist real typographic range (sans/serif/display).
 */
export const FONT_OPTIONS = [
  { key: "inter", label: "Inter", category: "sans" },
  { key: "poppins", label: "Poppins", category: "sans" },
  { key: "space_grotesk", label: "Space Grotesk", category: "sans" },
  { key: "playfair_display", label: "Playfair Display", category: "serif" },
  { key: "lora", label: "Lora", category: "serif" },
  { key: "dm_serif_display", label: "DM Serif Display", category: "serif" },
  { key: "bebas_neue", label: "Bebas Neue", category: "display" },
  { key: "oswald", label: "Oswald", category: "display" },
] as const;

export type FontKey = (typeof FONT_OPTIONS)[number]["key"];
export const FONT_KEYS = FONT_OPTIONS.map((option) => option.key) as [FontKey, ...FontKey[]];

export const DEFAULT_FONT_KEY: FontKey = "inter";

/** Plain CSS font-family stacks, keyed the same as FONT_OPTIONS — used
 * anywhere a real `font-family` value is needed outside of next/font's own
 * className mechanism (the dashboard's live preview loads these via a
 * Google Fonts <link>, not next/font, since it's a plain Vite SPA). */
export const FONT_FAMILY_CSS: Record<FontKey, string> = {
  inter: '"Inter", sans-serif',
  poppins: '"Poppins", sans-serif',
  space_grotesk: '"Space Grotesk", sans-serif',
  playfair_display: '"Playfair Display", serif',
  lora: '"Lora", serif',
  dm_serif_display: '"DM Serif Display", serif',
  bebas_neue: '"Bebas Neue", sans-serif',
  oswald: '"Oswald", sans-serif',
};

export const PRESET_ACCENT_COLORS = [
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#ffffff",
  "#000000",
] as const;

export const DEFAULT_THEME = {
  backgroundColor: "#0a0a0a",
  textColor: "#fafafa",
  accentColor: "#f43f5e",
  fontKey: DEFAULT_FONT_KEY as FontKey,
};
