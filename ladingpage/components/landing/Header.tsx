import Link from "next/link";
import { Container, GradientButton } from "./ui";

const NAV_LINKS = [
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Pra quem é", href: "#para-quem" },
  { label: "Planos", href: "#planos" },
  { label: "Segurança", href: "#seguranca" },
  { label: "FAQ", href: "#faq" },
];

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-bg/70 backdrop-blur-lg">
      <Container className="flex h-16 items-center justify-between">
        <Link href="#topo" className="font-[family-name:var(--font-display)] text-lg uppercase tracking-tight">
          autentic<span className="text-gradient-brand">.ai</span>
        </Link>
        <nav className="hidden items-center gap-6 font-[family-name:var(--font-body)] text-xs font-medium uppercase tracking-wide text-fg-muted lg:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-fg">
              {link.label}
            </Link>
          ))}
        </nav>
        <GradientButton href="#planos" className="px-5 py-2 text-xs">
          Começar agora
        </GradientButton>
      </Container>
    </header>
  );
}
