import { z } from "zod";

/**
 * Zod's `.url()` only checks that `new URL()` parses — `javascript:alert(1)`
 * and `data:text/html,...` both pass. Every URL we later render into an
 * `href`, `src` or CSS `url()` must come through here instead, so the only
 * schemes that ever reach the DOM are http and https.
 */
export const httpUrlSchema = z
  .string()
  .trim()
  .max(2048, "link muito longo")
  .url("use um link válido")
  .refine((value) => /^https?:\/\//i.test(value), { message: "use um link que comece com http:// ou https://" });
