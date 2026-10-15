import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { SITE_URL } from "../../config";
import { Logo } from "../ui";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { GOOGLE_CLIENT_ID } from "./googleIdentity";

const BENEFITS = [
  "14 dias de PRO grátis, sem cartão",
  "Saiba quando cada contratante abriu",
  "Seu link nunca sai do ar",
];

function tabClassName({ isActive }: { isActive: boolean }) {
  return (
    "flex min-h-11 flex-1 items-center justify-center rounded-[9px] px-3 text-[15px] transition " +
    (isActive ? "bg-bg-elevated-2 font-extrabold text-white" : "font-bold text-fg-muted hover:text-fg")
  );
}

type Props = {
  /** Omit both Google handlers to hide the Google button (e.g. the
   * password-recovery screen, where signing in with Google makes no sense). */
  onGoogleSuccess?: Parameters<typeof GoogleSignInButton>[0]["onSuccess"];
  onGoogleError?: (message: string) => void;
  /** Hides the "Criar conta / Entrar" tabs for flows that are neither. */
  hideTabs?: boolean;
  children: ReactNode;
};

/** Split screen shared by /login, /signup and /esqueci-senha: brand panel
 * on the left (on top on phones), tabs + Google + e-mail form on the right. */
export function AuthLayout({ onGoogleSuccess, onGoogleError, hideTabs = false, children }: Props) {
  const showGoogle = Boolean(GOOGLE_CLIENT_ID && onGoogleSuccess && onGoogleError);
  return (
    <div className="flex min-h-screen flex-col bg-bg text-fg lg:flex-row">
      <aside className="flex flex-col justify-between gap-8 bg-[#2A1B2E] px-6 py-8 sm:px-12 sm:py-12 lg:w-[45%] lg:max-w-[620px]">
        <Logo className="text-[26px]" />
        <div className="flex flex-col gap-4">
          <h1 className="font-display text-4xl uppercase leading-none sm:text-5xl lg:text-6xl">
            Seu presskit no ar em 10 minutos
          </h1>
          <ul className="flex flex-col gap-2.5 text-base text-[#E4DDE8]">
            {BENEFITS.map((benefit) => (
              <li key={benefit}>{benefit}</li>
            ))}
          </ul>
        </div>
        <p className="hidden text-[13px] text-[#C9C4D1] lg:block">Presskit.AI · um produto Grupo MK</p>
      </aside>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-12">
        <div className="flex w-full max-w-[400px] flex-col gap-5">
          {!hideTabs && (
            <nav className="flex gap-1.5 rounded-xl bg-bg-elevated p-1" aria-label="Entrar ou criar conta">
              <NavLink to="/signup" className={tabClassName}>
                Criar conta
              </NavLink>
              <NavLink to="/login" className={tabClassName}>
                Entrar
              </NavLink>
            </nav>
          )}

          {showGoogle && onGoogleSuccess && onGoogleError && (
            <>
              <GoogleSignInButton onSuccess={onGoogleSuccess} onError={onGoogleError} />
              <div className="flex items-center gap-3 text-[13px] text-fg-muted">
                <span className="h-px flex-1 bg-white/12" />
                ou com e-mail
                <span className="h-px flex-1 bg-white/12" />
              </div>
            </>
          )}

          {children}

          <p className="text-center text-xs leading-relaxed text-fg-muted">
            Ao continuar você aceita os{" "}
            <a href={`${SITE_URL}/termos`} className="text-primary-text hover:underline">
              Termos
            </a>{" "}
            e a{" "}
            <a href={`${SITE_URL}/privacidade`} className="text-primary-text hover:underline">
              Política de privacidade
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
