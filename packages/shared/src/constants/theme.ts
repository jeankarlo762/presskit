/**
 * A curated, finite list rather than free-text font entry — lets ladingpage
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

/** Page layouts the artist can switch between in "Personalizar". Stored in
 * Presskit.templateKey — an unknown/legacy key renders as "default". The
 * suggested heading font is applied by the dashboard when a template is
 * picked (the artist can change it afterwards); null = same as body font. */
export const TEMPLATE_OPTIONS = [
  {
    key: "default",
    label: "Clássico",
    description: "Direto ao ponto, títulos pequenos em destaque",
    suggestedHeadingFontKey: null,
  },
  {
    key: "palco",
    label: "Palco",
    description: "Capa grande e nome em letras gigantes",
    suggestedHeadingFontKey: "bebas_neue",
  },
  {
    key: "minimal",
    label: "Minimal",
    description: "Espaçoso, discreto, ótimo com fundo claro",
    suggestedHeadingFontKey: null,
  },
  {
    key: "editorial",
    label: "Editorial",
    description: "Cara de revista, centralizado e com serifa",
    suggestedHeadingFontKey: "playfair_display",
  },
] as const satisfies readonly {
  key: string;
  label: string;
  description: string;
  suggestedHeadingFontKey: FontKey | null;
}[];

export type TemplateKey = (typeof TEMPLATE_OPTIONS)[number]["key"];
export const TEMPLATE_KEYS = TEMPLATE_OPTIONS.map((option) => option.key) as [TemplateKey, ...TemplateKey[]];
export const DEFAULT_TEMPLATE_KEY: TemplateKey = "default";

export function resolveTemplateKey(key: string | null | undefined): TemplateKey {
  return (TEMPLATE_KEYS as readonly string[]).includes(key ?? "") ? (key as TemplateKey) : DEFAULT_TEMPLATE_KEY;
}

export const BUTTON_STYLES = ["SQUARE", "ROUNDED", "PILL"] as const;
export type ButtonStyle = (typeof BUTTON_STYLES)[number];
export const DEFAULT_BUTTON_STYLE: ButtonStyle = "ROUNDED";

export const BUTTON_STYLE_LABELS: Record<ButtonStyle, string> = {
  SQUARE: "Reto",
  ROUNDED: "Suave",
  PILL: "Pílula",
};

export const BUTTON_STYLE_RADIUS: Record<ButtonStyle, string> = {
  SQUARE: "0px",
  ROUNDED: "10px",
  PILL: "999px",
};

/** One-click color sets: background / text / accent. */
export const COLOR_PALETTES = [
  { key: "noite", label: "Noite", backgroundColor: "#120E16", textColor: "#F4F2F7", accentColor: "#E11D9C" },
  { key: "grafite", label: "Grafite", backgroundColor: "#111111", textColor: "#FAFAFA", accentColor: "#F97316" },
  { key: "papel", label: "Papel", backgroundColor: "#F5F3EF", textColor: "#111111", accentColor: "#2563EB" },
  { key: "oceano", label: "Oceano", backgroundColor: "#0B1B2B", textColor: "#E6F1FA", accentColor: "#22D3EE" },
  { key: "floresta", label: "Floresta", backgroundColor: "#0F1F17", textColor: "#ECF5EF", accentColor: "#A3E635" },
  { key: "areia", label: "Areia", backgroundColor: "#EFE6DA", textColor: "#2A1E14", accentColor: "#B4532A" },
] as const;
export type ColorPalette = (typeof COLOR_PALETTES)[number];
