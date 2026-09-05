"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "./AuthProvider";

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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={closeLoginModal}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-border bg-bg-elevated p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="font-[family-name:var(--font-display)] text-2xl uppercase tracking-tight text-fg">
          Entrar
        </h2>
        <p className="mt-1 text-sm text-fg-muted">Acesse sua conta presskit.ai</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-xs font-medium uppercase tracking-wide text-fg-muted">
            E-mail
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-fg outline-none focus:border-violet"
              placeholder="voce@email.com"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium uppercase tracking-wide text-fg-muted">
            Senha
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-fg outline-none focus:border-violet"
              placeholder="••••••••"
            />
          </label>

          {loginError && <p className="text-sm text-magenta">{loginError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-violet to-magenta px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <button
          type="button"
          onClick={closeLoginModal}
          className="mt-4 w-full text-center text-xs text-fg-muted hover:text-fg"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
