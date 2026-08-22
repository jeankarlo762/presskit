import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ARTIST_CATEGORY_LABELS, type ArtistCategory } from "@presskit/shared";
import { api } from "../api/axios";
import { logout } from "../api/auth";
import { useAuthStore } from "../store/auth.store";

type Presskit = { slug: string; category: ArtistCategory; published: boolean } | null;

export function DashboardHomePage() {
  const navigate = useNavigate();
  const { user, refreshToken, clearSession } = useAuthStore();
  const [presskit, setPresskit] = useState<Presskit>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ presskit: Presskit }>("/presskit")
      .then(({ data }) => {
        if (cancelled) return;
        if (!data.presskit) {
          navigate("/onboarding");
          return;
        }
        setPresskit(data.presskit);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function handleLogout() {
    if (refreshToken) await logout(refreshToken).catch(() => undefined);
    clearSession();
    navigate("/login");
  }

  if (loading) return <p className="p-8">Carregando...</p>;

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Olá, {user?.name}</h1>
        <button onClick={handleLogout} className="text-sm text-gray-500 underline">
          Sair
        </button>
      </div>
      {presskit && (
        <div className="rounded border p-4">
          <p className="text-sm text-gray-500">presskit.com.br/{presskit.slug}</p>
          <p className="mt-1 font-medium">{ARTIST_CATEGORY_LABELS[presskit.category]}</p>
          <p className="mt-1 text-sm">{presskit.published ? "Publicado" : "Rascunho"}</p>
        </div>
      )}
    </div>
  );
}
