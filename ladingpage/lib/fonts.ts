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

/** Generated font-family names (self-hosted @font-face from next/font),
 * handed to PresskitRenderer, which applies one to the body text and one to
 * headings/the artist name. Using the family names rather than a wrapper
 * className is what lets two different fonts be active on the same page. */
export const FONT_FAMILY: Record<FontKey, string> = {
  inter: inter.style.fontFamily,
  poppins: poppins.style.fontFamily,
  space_grotesk: spaceGrotesk.style.fontFamily,
  playfair_display: playfairDisplay.style.fontFamily,
  lora: lora.style.fontFamily,
  dm_serif_display: dmSerifDisplay.style.fontFamily,
  bebas_neue: bebasNeue.style.fontFamily,
  oswald: oswald.style.fontFamily,
};
