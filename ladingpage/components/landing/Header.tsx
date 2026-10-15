"use client";

import Link from "next/link";
import { ButtonLink, Container } from "./ui";
import { useAuth } from "./AuthProvider";
import { UserMenu } from "./UserMenu";
import { DASHBOARD_SIGNUP_URL } from "../../lib/urls";

const NAV_LINKS = [
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Exemplos", href: "#exemplos" },
  { label: "Planos", href: "#planos" },
];

export function Header() {
  const { status, openLoginModal } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/90 backdrop-blur-md">
      <Container className="flex h-[72px] items-center justify-between gap-3">
        <Link href="#topo" className="font-display text-xl tracking-[0.02em] uppercase min-[400px]:text-2xl sm:text-[28px]">
          Presskit<span className="text-action">.AI</span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-7">
          <nav aria-label="Principal" className="hidden items-center gap-7 text-[15px] font-semibold md:flex">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-soft transition-colors hover:text-fg">
                {link.label}
              </Link>
            ))}
          </nav>

          {status === "authenticated" ? (
            <UserMenu />
          ) : status === "anonymous" ? (
            <>
              <button
                type="button"
                onClick={openLoginModal}
                className="min-h-11 text-[15px] font-semibold text-fg transition-colors hover:text-accent"
              >
                Entrar
              </button>
              <ButtonLink href={DASHBOARD_SIGNUP_URL} className="px-3.5 sm:px-5">
                <span className="sm:hidden">Testar grátis</span>
                <span className="hidden sm:inline">Testar 14 dias grátis</span>
              </ButtonLink>
            </>
          ) : (
            <div className="h-11 w-11" aria-hidden />
          )}
        </div>
      </Container>
    </header>
  );
}
