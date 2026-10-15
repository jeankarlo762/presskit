"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { PUBLIC_API_URL } from "../../lib/urls";
import type { SiteUser } from "../../lib/auth-client";
import { useAuth } from "./AuthProvider";

// --- Google Identity Services (minimal typing + one-time loader) ----------

type GoogleCredentialResponse = { credential: string };
type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    ux_mode?: "popup" | "redirect";
    cancel_on_tap_outside?: boolean;
  }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, string | number>) => void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || undefined;
let gsiPromise: Promise<GoogleAccountsId> | null = null;

function loadGoogleIdentity(): Promise<GoogleAccountsId> {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  gsiPromise ??= new Promise<GoogleAccountsId>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () =>
      window.google?.accounts?.id ? resolve(window.google.accounts.id) : reject(new Error("GIS indisponível"));
    script.onerror = () => reject(new Error("Não foi possível carregar o login do Google"));
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    gsiPromise = null;
    throw error;
  });
  return gsiPromise;
}

type GoogleSession = { user: SiteUser; accessToken: string; refreshToken: string; isNewUser: boolean };

async function googleLogin(credential: string): Promise<GoogleSession> {
  const res = await fetch(`${PUBLIC_API_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? "Não foi possível entrar com o Google");
  }
  return res.json();
}

function GoogleButton({ clientId }: { clientId: string }) {
  const { signInWithSession } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadGoogleIdentity()
      .then((gsi) => {
        const container = containerRef.current;
        if (cancelled || !container) return;
        gsi.initialize({
          client_id: clientId,
          ux_mode: "popup",
          cancel_on_tap_outside: true,
          callback: async ({ credential }) => {
            setPending(true);
            setError(null);
            try {
              signInWithSession(await googleLogin(credential));
            } catch (err) {
              if (!cancelled) setError(err instanceof Error ? err.message : "Não foi possível entrar com o Google");
            } finally {
              if (!cancelled) setPending(false);
            }
          },
        });
        container.replaceChildren();
        gsi.renderButton(container, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "center",
          locale: "pt-BR",
          width: Math.round(Math.min(400, Math.max(200, container.clientWidth))),
        });
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Login com Google indisponível");
      });
    return () => {
      cancelled = true;
    };
  }, [clientId, signInWithSession]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={containerRef}
        aria-busy={pending}
        className={"flex min-h-11 w-full justify-center" + (pending ? " pointer-events-none opacity-60" : "")}
      />
      {pending && <p className="text-sm text-muted">Entrando com o Google...</p>}
      {error && <p className="text-sm text-accent">{error}</p>}
    </div>
  );
}

// --- Modal -----------------------------------------------------------------

const fieldClassName =
  "min-h-11 rounded-xl border border-white/15 bg-bg px-4 py-3 text-[15px] text-fg outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-action/30";

export function LoginModal() {
  const { loginModalOpen, closeLoginModal, login, loginError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loginModalOpen) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      setEmail("");
      setPassword("");
    } catch {
      // loginError já reflete a falha; formulário permanece aberto.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onClick={closeLoginModal}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="login-modal-title" className="font-display text-2xl uppercase tracking-tight text-fg">
          Entrar
        </h2>
        <p className="mt-1 text-sm text-muted">Acesse sua conta presskit.ai</p>

        {GOOGLE_CLIENT_ID && (
          <div className="mt-6 flex flex-col gap-5">
            <GoogleButton clientId={GOOGLE_CLIENT_ID} />
            <div className="flex items-center gap-3 text-[13px] text-muted">
              <span className="h-px flex-1 bg-white/12" />
              ou com e-mail
              <span className="h-px flex-1 bg-white/12" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className={(GOOGLE_CLIENT_ID ? "mt-5" : "mt-6") + " flex flex-col gap-4"}>
          <label className="flex flex-col gap-2 text-sm font-bold text-fg">
            E-mail
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={fieldClassName}
              placeholder="voce@email.com"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-bold text-fg">
            Senha
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={fieldClassName}
              placeholder="••••••••"
            />
          </label>

          {loginError && <p className="text-sm text-accent">{loginError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 inline-flex min-h-11 items-center justify-center rounded-xl bg-action px-6 py-3 text-[15px] font-extrabold text-white transition hover:bg-action-hover disabled:opacity-60"
          >
            {submitting ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <button
          type="button"
          onClick={closeLoginModal}
          className="mt-3 min-h-11 w-full rounded-xl text-center text-sm text-muted hover:text-fg"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
