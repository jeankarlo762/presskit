import { ButtonLink, Container } from "./ui";
import { DASHBOARD_SIGNUP_URL } from "../../lib/urls";

export function Hero() {
  return (
    <section id="topo">
      <Container className="flex flex-wrap items-center gap-14 pt-10 pb-20 sm:pt-14">
        <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-6">
          <p className="self-start rounded-full border border-white/12 px-3.5 py-1.5 text-[13px] font-semibold text-soft">
            Para DJs, músicos, bandas, atores e artistas visuais
          </p>
          <h1 className="font-display text-[52px] leading-[0.98] uppercase sm:text-7xl lg:text-[84px]">
            Um link.
            <br />
            Zero PDF.
            <br />
            <span className="text-action">Mais shows.</span>
          </h1>
          <p className="max-w-[520px] text-lg leading-relaxed text-soft sm:text-xl">
            Monte seu presskit profissional em 10 minutos, mande para contratantes e veja quando cada um abriu.
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={DASHBOARD_SIGNUP_URL} size="lg">
              Criar meu presskit grátis
            </ButtonLink>
            <ButtonLink href="#exemplos" size="lg" variant="outline">
              Ver exemplos reais
            </ButtonLink>
          </div>
          <p className="text-sm text-muted">14 dias de PRO grátis · sem cartão · cancele quando quiser</p>
        </div>

        <PhoneMockup />
      </Container>
    </section>
  );
}

function PhoneMockup() {
  return (
    <div
      role="img"
      aria-label={'Exemplo de presskit aberto no celular, com o aviso: seu link para "Clube [X]" foi aberto.'}
      className="relative flex min-w-0 flex-[1_1_440px] justify-center pt-16 sm:pt-0"
    >
      <div aria-hidden className="w-[280px] rounded-[36px] border border-white/12 bg-surface p-3.5 shadow-[0_40px_80px_rgba(0,0,0,0.5)] sm:w-[300px]">
        <div className="overflow-hidden rounded-3xl bg-band">
          <div className="flex h-[220px] items-end bg-[#2A1B2E] p-[18px]">
            <span className="font-display text-[34px] leading-none uppercase">[Nome do artista]</span>
          </div>
          <div className="flex flex-col gap-2.5 p-4">
            <span className="text-xs font-bold tracking-[1px] text-muted uppercase">DJ · Techno · São Paulo</span>
            <span className="flex h-[52px] items-center gap-2.5 rounded-[10px] bg-surface-2 px-3 text-[13px]">
              <span className="inline-block h-7 w-7 rounded-md bg-[#8B5CF6]" />
              Último set · SoundCloud
            </span>
            <span className="grid grid-cols-3 gap-1.5">
              <span className="aspect-square rounded-md bg-[#2B2533]" />
              <span className="aspect-square rounded-md bg-[#332B3D]" />
              <span className="aspect-square rounded-md bg-[#2B2533]" />
            </span>
            <span className="flex h-11 items-center justify-center rounded-[10px] bg-action text-sm font-bold text-white">
              Contratar para um evento
            </span>
          </div>
        </div>
      </div>
      <div
        aria-hidden
        className="absolute top-0 right-0 flex w-[230px] flex-col gap-1 rounded-[14px] bg-white px-4 py-3.5 text-[#141216] shadow-[0_20px_40px_rgba(0,0,0,0.4)] sm:top-10 sm:right-2"
      >
        <span className="text-xs font-bold text-[#5F5869]">Agora mesmo</span>
        <span className="text-[15px] leading-snug font-extrabold">Seu link para &quot;Clube [X]&quot; foi aberto</span>
        <span className="text-[13px] text-[#4A4452]">Ouviu o set e baixou o rider técnico.</span>
      </div>
    </div>
  );
}
