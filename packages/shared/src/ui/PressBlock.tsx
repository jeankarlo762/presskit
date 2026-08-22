import type { PressSectionData } from "../schemas/section";
import type { PublicPressMention } from "../types/publicPresskit";

export function PressBlock({ data, mentions }: { data: PressSectionData; mentions: PublicPressMention[] }) {
  if (!data.highlightStats && mentions.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Imprensa</h2>
      {data.highlightStats && <p className="text-sm font-medium">{data.highlightStats}</p>}
      {mentions.length > 0 && (
        <ul className="flex flex-col gap-3">
          {mentions.map((mention) => (
            <li key={mention.id} className="text-sm">
              {mention.url ? (
                <a
                  href={mention.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline underline-offset-2"
                >
                  {mention.outlet}
                </a>
              ) : (
                <span className="font-medium">{mention.outlet}</span>
              )}
              {mention.quote && (
                <p className="text-neutral-600 dark:text-neutral-300">"{mention.quote}"</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
