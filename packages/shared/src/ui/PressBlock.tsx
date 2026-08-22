import type { PressSectionData } from "../schemas/section";
import type { PublicPressMention } from "../types/publicPresskit";
import { SectionHeading } from "./SectionHeading";

export function PressBlock({
  title,
  data,
  mentions,
}: {
  title: string;
  data: PressSectionData;
  mentions: PublicPressMention[];
}) {
  if (!data.highlightStats && mentions.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <SectionHeading>{title}</SectionHeading>
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
                  className="font-medium text-[var(--presskit-accent)] underline underline-offset-2"
                >
                  {mention.outlet}
                </a>
              ) : (
                <span className="font-medium">{mention.outlet}</span>
              )}
              {mention.quote && <p className="text-[var(--presskit-muted)]">"{mention.quote}"</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
