"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:5173";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-bg-elevated-2 text-xs font-bold uppercase text-fg transition-transform hover:scale-105"
        aria-label="Menu da conta"
      >
        {initials(user.name)}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-border bg-bg-elevated p-2 shadow-2xl">
            <div className="border-b border-border px-3 py-2">
              <p className="truncate text-sm font-medium text-fg">{user.name}</p>
              <p className="truncate text-xs text-fg-muted">{user.email}</p>
            </div>

            <a
              href={DASHBOARD_URL}
              className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm text-fg hover:bg-white/5"
            >
              Ir para o painel
            </a>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm text-magenta hover:bg-white/5"
            >
              Sair
            </button>
          </div>
        </>
      )}
    </div>
  );
}
