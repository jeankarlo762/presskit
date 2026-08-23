import {
  Inter,
  Poppins,
  Space_Grotesk,
  Playfair_Display,
  Lora,
  DM_Serif_Display,
  Bebas_Neue,
  Oswald,
} from "next/font/google";
import type { FontKey } from "@presskit/shared";

// next/font/google imports must be static (build-time) — the artist's font
// choice is a runtime DB value, so every curated option is loaded up front
// and the right one is picked at render time. Self-hosted by Next.js, no
// runtime request to Google (unlike the dashboard's <link> tag, which is
// fine there since it's an internal tool, not the public page).
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const playfairDisplay = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const lora = Lora({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const dmSerifDisplay = DM_Serif_Display({ subsets: ["latin"], weight: ["400"] });
const bebasNeue = Bebas_Neue({ subsets: ["latin"], weight: ["400"] });
const oswald = Oswald({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const FONT_CLASS_NAME: Record<FontKey, string> = {
  inter: inter.className,
  poppins: poppins.className,
  space_grotesk: spaceGrotesk.className,
  playfair_display: playfairDisplay.className,
  lora: lora.className,
  dm_serif_display: dmSerifDisplay.className,
  bebas_neue: bebasNeue.className,
  oswald: oswald.className,
};
