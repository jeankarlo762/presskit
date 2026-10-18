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

// ---------------------------------------------------------------------------
// Background fine-tuning
// ---------------------------------------------------------------------------

export const BACKGROUND_POSITIONS = ["center", "top", "bottom"] as const;
export type BackgroundPosition = (typeof BACKGROUND_POSITIONS)[number];
export const BACKGROUND_POSITION_LABELS: Record<BackgroundPosition, string> = {
  center: "Centro",
  top: "Topo",
  bottom: "Base",
};

export const BACKGROUND_ATTACHMENTS = ["FIXED", "SCROLL"] as const;
export type BackgroundAttachment = (typeof BACKGROUND_ATTACHMENTS)[number];
export const BACKGROUND_ATTACHMENT_LABELS: Record<BackgroundAttachment, string> = {
  FIXED: "Fixo (parallax)",
  SCROLL: "Rola com a página",
};

export const BACKGROUND_OVERLAY_MAX = 90;
export const BACKGROUND_BLUR_MAX = 20;

const GRAIN_SVG = encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0.4 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>",
);

export type BackgroundPreset = {
  key: string;
  label: string;
  /** CSS background-image layer, written with the theme variables so it
   * recolors itself when the palette changes; null = no preset. */
  css: string | null;
  /** background-size for tiled patterns; undefined = cover. */
  size?: string;
};

/** Ready-made gradients and textures that need no photo. They sit between
 * the darkening overlay and the (optional) image, so they also work as a
 * subtle tint on top of a photo. */
export const BACKGROUND_PRESETS: readonly BackgroundPreset[] = [
  { key: "none", label: "Nenhum", css: null },
  {
    key: "aurora",
    label: "Aurora",
    css: "radial-gradient(70% 60% at 15% 0%, color-mix(in srgb, var(--presskit-accent) 45%, transparent), transparent 70%), radial-gradient(60% 50% at 85% 100%, color-mix(in srgb, var(--presskit-accent) 30%, transparent), transparent 70%)",
  },
  {
    key: "spotlight",
    label: "Holofote",
    css: "radial-gradient(80% 55% at 50% -10%, color-mix(in srgb, var(--presskit-accent) 42%, transparent), transparent 72%)",
  },
  {
    key: "sunset",
    label: "Pôr do sol",
    css: "linear-gradient(180deg, color-mix(in srgb, var(--presskit-accent) 38%, transparent) 0%, transparent 65%)",
  },
  {
    key: "mesh",
    label: "Mesh",
    css: "radial-gradient(40% 35% at 20% 20%, color-mix(in srgb, var(--presskit-accent) 38%, transparent), transparent), radial-gradient(35% 35% at 80% 30%, color-mix(in srgb, var(--presskit-text) 12%, transparent), transparent), radial-gradient(45% 40% at 60% 85%, color-mix(in srgb, var(--presskit-accent) 26%, transparent), transparent)",
  },
  {
    key: "stripes",
    label: "Listras",
    css: "repeating-linear-gradient(135deg, color-mix(in srgb, var(--presskit-text) 7%, transparent) 0 2px, transparent 2px 14px)",
  },
  {
    key: "dots",
    label: "Pontos",
    css: "radial-gradient(color-mix(in srgb, var(--presskit-text) 14%, transparent) 1.2px, transparent 1.5px)",
    size: "18px 18px",
  },
  {
    key: "grid",
    label: "Grade",
    css: "linear-gradient(color-mix(in srgb, var(--presskit-text) 8%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--presskit-text) 8%, transparent) 1px, transparent 1px)",
    size: "32px 32px",
  },
  { key: "grain", label: "Grão", css: `url("data:image/svg+xml,${GRAIN_SVG}")`, size: "160px 160px" },
];

export const BACKGROUND_PRESET_KEYS = BACKGROUND_PRESETS.map((preset) => preset.key) as [string, ...string[]];

export function resolveBackgroundPreset(key: string | null | undefined): BackgroundPreset {
  return BACKGROUND_PRESETS.find((preset) => preset.key === key) ?? BACKGROUND_PRESETS[0]!;
}

// ---------------------------------------------------------------------------
// Site structure: navigation and per-section layout/style options
// ---------------------------------------------------------------------------

export const NAV_MODES = ["SCROLL", "TABS"] as const;
export type NavMode = (typeof NAV_MODES)[number];
export const NAV_MODE_LABELS: Record<NavMode, string> = {
  SCROLL: "Página única (rolagem com menu)",
  TABS: "Abas (uma seção por vez)",
};

export const SECTION_WIDTHS = ["narrow", "normal", "wide", "full"] as const;
export type SectionWidth = (typeof SECTION_WIDTHS)[number];
export const SECTION_WIDTH_LABELS: Record<SectionWidth, string> = {
  narrow: "Estreita",
  normal: "Normal",
  wide: "Larga",
  full: "Toda a largura",
};
export const SECTION_WIDTH_CLASS: Record<SectionWidth, string> = {
  narrow: "max-w-xl",
  normal: "max-w-2xl",
  wide: "max-w-5xl",
  full: "max-w-none",
};

export const SECTION_PADDINGS = ["compact", "normal", "spacious"] as const;
export type SectionPadding = (typeof SECTION_PADDINGS)[number];
export const SECTION_PADDING_LABELS: Record<SectionPadding, string> = {
  compact: "Compacto",
  normal: "Normal",
  spacious: "Espaçoso",
};
export const SECTION_PADDING_CLASS: Record<SectionPadding, string> = {
  compact: "py-6 @3xl:py-8",
  normal: "py-10 @3xl:py-14",
  spacious: "py-16 @3xl:py-24",
};

export const SECTION_ALIGNS = ["left", "center"] as const;
export type SectionAlign = (typeof SECTION_ALIGNS)[number];
export const SECTION_ALIGN_LABELS: Record<SectionAlign, string> = { left: "Esquerda", center: "Centro" };

/** Layout variants each section type can switch between (first = default). */
export const SECTION_LAYOUTS: Record<string, readonly { key: string; label: string }[]> = {
  BIO: [
    { key: "text", label: "Texto" },
    { key: "split", label: "Foto ao lado do texto" },
  ],
  GALLERY: [
    { key: "grid", label: "Grade" },
    { key: "masonry", label: "Mosaico" },
    { key: "strip", label: "Carrossel horizontal" },
  ],
  MUSIC: [
    { key: "list", label: "Lista" },
    { key: "grid", label: "Grade" },
  ],
  VIDEO: [
    { key: "list", label: "Lista" },
    { key: "grid", label: "Grade" },
  ],
  TOUR_DATES: [
    { key: "list", label: "Lista" },
    { key: "cards", label: "Cartões" },
  ],
  TESTIMONIALS: [
    { key: "cards", label: "Cartões" },
    { key: "quotes", label: "Citações grandes" },
  ],
  STATS: [
    { key: "row", label: "Em linha" },
    { key: "cards", label: "Cartões" },
  ],
  DOWNLOADS: [
    { key: "list", label: "Lista" },
    { key: "cards", label: "Cartões" },
  ],
};

export function resolveSectionLayout(type: string, layout: string | null | undefined): string {
  const options = SECTION_LAYOUTS[type];
  if (!options || options.length === 0) return "default";
  return options.some((option) => option.key === layout) ? (layout as string) : options[0]!.key;
}
