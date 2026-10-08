import { useEffect } from "react";
import {
  AlertTriangle,
  CreditCard,
  FileEdit,
  FolderKanban,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  MessageSquare,
  Receipt,
  ShieldCheck,
  Sparkles,
  Upload,
  UserCircle,
  Users,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { fetchMe, logout } from "../../api/auth";
import { isSuperadmin, useAuthStore } from "../../store/auth.store";
import { GrainOverlay, Logo } from "../ui";

type NavItem = { to: string; label: string; icon: typeof FileEdit; end?: boolean };

const EDITOR_ITEM: NavItem = { to: "/", label: "Editar Presskit", icon: FileEdit, end: true };

const CONTA_ITEMS: NavItem[] = [
  { to: "/assinatura", label: "Assinatura", icon: CreditCard },
  { to: "/feedback", label: "Feedback", icon: MessageSquare },
];

const PROJETO_ITEMS: NavItem[] = [
  { to: "/projeto/crie-com-ia", label: "Crie com IA", icon: Sparkles },
  { to: "/projeto/uploads", label: "Uploads", icon: Upload },
  { to: "/projeto/modelos-prontos", label: "Modelos prontos", icon: LayoutTemplate },
];

const ADMIN_ITEMS: NavItem[] = [
  { to: "/admin", label: "Visão geral", icon: LayoutDashboard, end: true },
  { to: "/admin/usuarios", label: "Usuários", icon: Users },
  { to: "/admin/assinaturas", label: "Assinaturas", icon: CreditCard },
  { to: "/admin/pagamentos", label: "Pagamentos", icon: Receipt },
  { to: "/admin/inadimplencia", label: "Inadimplência", icon: AlertTriangle },
  { to: "/admin/feedback", label: "Feedback", icon: MessageSquare },
];

function navLinkClassName({ isActive }: { isActive: boolean }) {
  return (
    "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition " +
    (isActive ? "bg-white/10 text-fg" : "text-fg-muted hover:bg-white/5 hover:text-fg")
  );
}

function NavGroup({ icon: Icon, label, items }: { icon: typeof FileEdit; label: string; items: NavItem[] }) {
  return (
    <>
      <p className="mt-4 px-3 text-xs font-semibold uppercase tracking-wide text-fg-muted/70">
        <Icon size={14} className="mr-1.5 inline-block align-text-bottom" />
        {label}
      </p>
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClassName}>
          <item.icon size={18} />
          {item.label}
        </NavLink>
      ))}
    </>
  );
}

export function DashboardLayout() {
  const navigate = useNavigate();
  const { user, refreshToken, clearSession, setUser } = useAuthStore();

  // Re-read the profile on mount: role/plan may have changed server-side
  // (promoted to superadmin, subscription approved) since it was stored.
  useEffect(() => {
    fetchMe()
      .then(setUser)
      .catch(() => undefined);
  }, [setUser]);

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

            <NavGroup icon={UserCircle} label="Conta" items={CONTA_ITEMS} />
            <NavGroup icon={FolderKanban} label="Projeto" items={PROJETO_ITEMS} />
            {isSuperadmin(user) && <NavGroup icon={ShieldCheck} label="Administração" items={ADMIN_ITEMS} />}
          </nav>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
          <p className="truncate px-3 text-sm text-fg-muted">
            {user?.name}
            <span className={"ml-2 text-[11px] " + (user?.planKey === "PRO" ? "text-emerald-400" : "text-fg-muted/70")}>
              {user?.planKey}
            </span>
            {isSuperadmin(user) && <span className="ml-2 text-[11px] text-violet">superadmin</span>}
          </p>
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
