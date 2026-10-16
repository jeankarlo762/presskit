"use client";

import { useEffect } from "react";
import { PUBLIC_API_URL } from "../../lib/urls";

/**
 * Reports clicks on the public page's conversion elements (anything with a
 * data-track attribute: WhatsApp button, quick links, header CTAs). One
 * listener on the document, sendBeacon so the navigation is never delayed.
 */
export function ClickTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const endpoint = `${PUBLIC_API_URL}/public/presskits/${encodeURIComponent(slug)}/click`;
    const handler = (event: MouseEvent) => {
      const element = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-track]");
      const target = element?.dataset.track;
      if (!target) return;
      const payload = JSON.stringify({ target });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, new Blob([payload], { type: "application/json" }));
      } else {
        fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }).catch(
          () => undefined,
        );
      }
    };
    document.addEventListener("click", handler, { capture: true });
    return () => document.removeEventListener("click", handler, { capture: true });
  }, [slug]);
  return null;
}
