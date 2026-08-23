import {
  BarChart3,
  Download,
  Languages,
  Layers,
  Sparkles,
  Upload,
  Wand2,
  Waypoints,
} from "lucide-react";
import { Container, Eyebrow, SectionHeading } from "./ui";

const FEATURES = [
  { icon: Wand2, title: "Bio gerada por IA", body: "Responde poucas perguntas e a IA escreve sua bio e textos de apresentação." },
  { icon: Layers, title: "Templates por estilo", body: "Layout que muda com seu gênero — trap, pop, MPB e mais, cada um com a cara certa." },
  { icon: Upload, title: "Fotos, áudio e vídeo", body: "Sobe seu material e organiza tudo num só lugar, sem perder qualidade." },
  { icon: Waypoints, title: "Métricas automáticas", body: "Puxa números direto do Spotify, Instagram e YouTube pra deixar seu press kit sempre atualizado." },
  { icon: Download, title: "Exportação em PDF", body: "Gera um PDF de alta qualidade, pronto pra mandar por e-mail ou imprimir." },
  { icon: Sparkles, title: "Múltiplas versões", body: "Uma versão pra imprensa, outra pra patrocinador, outra pra selo — tudo do mesmo press kit." },
  { icon: BarChart3, title: "Estatísticas de acesso", body: "Veja quem visualizou e baixou seu material, e quando." },
  { icon: Languages, title: "PT / EN / ES", body: "Seu press kit em três idiomas, pra negociar em qualquer mercado." },
];

export function Features() {
  return (
    <section id="funcionalidades" className="border-t border-border py-24">
      <Container>
        <Eyebrow>funcionalidades</Eyebrow>
        <SectionHeading className="max-w-2xl">
          Tudo que seu <span className="text-gradient-brand">material</span> precisa
        </SectionHeading>
        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="group rounded-2xl border border-border bg-bg-elevated p-6 transition-colors hover:border-white/20"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet/20 to-magenta/20 text-violet transition-colors group-hover:text-magenta">
                <Icon size={20} strokeWidth={2} />
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-lg uppercase tracking-tight">{title}</h3>
              <p className="mt-2 font-[family-name:var(--font-body)] text-sm leading-relaxed text-fg-muted">
                {body}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
