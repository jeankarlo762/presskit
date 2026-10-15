import { Container, SectionHeading } from "./ui";

// PLACEHOLDERS: swap for real published presskits (with the artists'
// permission) before launch. Do not replace with invented names or numbers.
const EXAMPLES = [
  { name: "[ARTISTA 1]", category: "DJ · House", color: "#2A1B2E" },
  { name: "[ARTISTA 2]", category: "Banda · Rock", color: "#1C2333" },
  { name: "[ARTISTA 3]", category: "Atriz", color: "#2E2419" },
  { name: "[ARTISTA 4]", category: "Artista visual", color: "#1B2A26" },
];

export function Examples() {
  return (
    <section id="exemplos">
      <Container className="flex flex-col gap-7 pb-16 sm:pb-[72px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading>Artistas que já usam</SectionHeading>
          <p className="text-[15px] text-muted">Exemplos de presskits por categoria</p>
        </div>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {EXAMPLES.map((example) => (
            <li key={example.name} className="overflow-hidden rounded-2xl border border-line bg-surface">
              <div
                role="img"
                aria-label={`Foto de ${example.name} (espaço reservado)`}
                className="h-[220px]"
                style={{ backgroundColor: example.color }}
              />
              <div className="flex flex-col gap-1 p-4">
                <h3 className="text-base font-extrabold">{example.name}</h3>
                <p className="text-[13px] text-muted">{example.category}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
