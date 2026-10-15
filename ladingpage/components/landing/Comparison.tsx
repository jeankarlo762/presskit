import { Container, SectionHeading } from "./ui";

const ROWS = [
  { label: "Abre no celular", pdf: "Pesado e com zoom", presskit: "Abre em 1 segundo" },
  { label: "Música e vídeo", pdf: "Links soltos", presskit: "Players dentro da página" },
  { label: "Sempre atualizado", pdf: "Versão nova a cada mudança", presskit: "Edita e o link é o mesmo" },
  { label: "Saber se foi visto", pdf: "Impossível", presskit: "Aviso de quem abriu e o que viu" },
];

export function Comparison() {
  return (
    <section id="por-que" aria-labelledby="por-que-titulo">
      <Container className="flex flex-col gap-8 py-16 sm:py-[72px]">
        <SectionHeading>
          <span id="por-que-titulo">Por que trocar o PDF</span>
        </SectionHeading>
        {/* The table keeps its columns on phones and scrolls sideways inside
            its own box, so the page itself never scrolls horizontally. */}
        <div
          className="overflow-x-auto rounded-2xl border border-line"
          tabIndex={0}
          role="region"
          aria-labelledby="por-que-titulo"
        >
          <table className="w-full min-w-[640px] border-collapse text-left text-base">
            <thead>
              <tr className="bg-surface">
                <td className="px-6 py-[18px]" />
                <th scope="col" className="px-6 py-[18px] font-bold text-muted">
                  PDF ou pasta no Drive
                </th>
                <th scope="col" className="px-6 py-[18px] font-extrabold text-fg">
                  Presskit.AI
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label} className="border-t border-white/8">
                  <th scope="row" className="px-6 py-[18px] font-bold">
                    {row.label}
                  </th>
                  <td className="px-6 py-[18px] text-muted">{row.pdf}</td>
                  <td className="px-6 py-[18px]">{row.presskit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Container>
    </section>
  );
}
