import Link from "next/link";
import { Container } from "./ui";

const LINKS = [
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Planos", href: "#planos" },
  { label: "Segurança", href: "#seguranca" },
  { label: "FAQ", href: "#faq" },
];

export function Footer() {
  return (
    <footer className="border-t border-border py-16">
      <Container className="flex flex-col gap-10">
        <div className="flex flex-col justify-between gap-8 sm:flex-row">
          <div>
            <p className="font-[family-name:var(--font-display)] text-2xl uppercase tracking-tight">
              presskit<span className="text-gradient-brand">.ai</span>
            </p>
            <p className="mt-2 max-w-xs font-[family-name:var(--font-body)] text-sm text-fg-muted">
              Press kit profissional pra artista musical, gerado com IA.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-8 gap-y-2 font-[family-name:var(--font-body)] text-sm text-fg-muted">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-fg">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-col justify-between gap-4 border-t border-border pt-8 text-xs text-fg-muted sm:flex-row">
          <p>© {new Date().getFullYear()} PressKit.AI. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <Link href="/termos" className="hover:text-fg">
              Termos de uso
            </Link>
            <Link href="/privacidade" className="hover:text-fg">
              Política de privacidade
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
