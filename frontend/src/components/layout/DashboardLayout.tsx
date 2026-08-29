import { FileEdit, FolderKanban, LayoutTemplate, LogOut, Sparkles, Upload } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { logout } from "../../api/auth";
import { useAuthStore } from "../../store/auth.store";
import { GrainOverlay, Logo } from "../ui";

type NavItem = { to: string; label: string; icon: typeof FileEdit; end?: boolean };

const EDITOR_ITEM: NavItem = { to: "/", label: "Editar Presskit", icon: FileEdit, end: true };

const PROJETO_ITEMS: NavItem[] = [
  { to: "/projeto/crie-com-ia", label: "Crie com IA", icon: Sparkles },
  { to: "/projeto/uploads", label: "Uploads", icon: Upload },
  { to: "/projeto/modelos-prontos", label: "Modelos prontos", icon: LayoutTemplate },
];

function navLinkClassName({ isActive }: { isActive: boolean }) {
  return (
    "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition " +
    (isActive ? "bg-white/10 text-fg" : "text-fg-muted hover:bg-white/5 hover:text-fg")
  );
}

export function DashboardLayout() {
  const navigate = useNavigate();
  const { user, refreshToken, clearSession } = useAuthStore();

  async function handleLogout() {
    if (refreshToken) await logout(refreshToken).catch(() => undefined);
    clearSession();
    navigate("/login");
  }

  return (
    <div className="relative flex min-h-screen bg-bg">
      <GrainOverlay />

      <aside className="flex w-64 shrink-0 flex-col justify-between border-r border-white/5 bg-bg-elevated p-4">
        <div className="flex flex-col gap-6">
          <Logo className="px-2 text-lg" />

          <nav className="flex flex-col gap-1">
            <NavLink to={EDITOR_ITEM.to} end={EDITOR_ITEM.end} className={navLinkClassName}>
              <EDITOR_ITEM.icon size={18} />
              {EDITOR_ITEM.label}
            </NavLink>

            <p className="mt-4 px-3 text-xs font-semibold uppercase tracking-wide text-fg-muted/70">
              <FolderKanban size={14} className="mr-1.5 inline-block align-text-bottom" />
              Projeto
            </p>
            {PROJETO_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLinkClassName}>
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
          <p className="truncate px-3 text-sm text-fg-muted">{user?.name}</p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-fg-muted transition hover:bg-white/5 hover:text-fg"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
