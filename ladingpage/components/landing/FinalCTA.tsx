import { ButtonLink, Container } from "./ui";
import { DASHBOARD_SIGNUP_URL } from "../../lib/urls";

export function FinalCTA() {
  return (
    <section className="border-t border-line">
      <Container className="flex flex-col items-center gap-6 py-20 text-center sm:py-[88px]">
        <h2 className="font-display text-[40px] leading-none uppercase sm:text-6xl lg:text-[64px]">
          Seu próximo contratante
          <br />
          já está no WhatsApp
        </h2>
        <ButtonLink href={DASHBOARD_SIGNUP_URL} size="lg" className="px-8 font-extrabold sm:text-lg">
          Criar meu presskit grátis
        </ButtonLink>
      </Container>
    </section>
  );
}
