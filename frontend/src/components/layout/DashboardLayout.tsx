import { useEffect } from "react";
import {
  AlertTriangle,
  BarChart3,
  CreditCard,
  FileEdit,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Palette,
  Receipt,
  Send,
  ShieldCheck,
  UserCircle,
  Users,
} from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { fetchMe, logout } from "../../api/auth";
import { isSuperadmin, useAuthStore } from "../../store/auth.store";
import { Logo } from "../ui";

type NavItem = { to: string; label: string; icon: typeof FileEdit; end?: boolean };

// The artist's journey, in order: build it, make it theirs, send it, see
// who opened it, then the account chores.
const MAIN_ITEMS: NavItem[] = [
  { to: "/", label: "Meu presskit", icon: FileEdit, end: true },
  { to: "/personalizar", label: "Personalizar", icon: Palette },
  { to: "/compartilhar", label: "Compartilhar", icon: Send },
  { to: "/quem-abriu", label: "Quem abriu", icon: BarChart3 },
];

const CONTA_ITEMS: NavItem[] = [
  { to: "/assinatura", label: "Assinatura", icon: CreditCard },
  { to: "/conta", label: "Minha conta", icon: UserCircle },
  { to: "/feedback", label: "Feedback", icon: MessageSquare },
];

const TRIAL_DAYS = 14;

/** Sidebar card while the free PRO trial runs: days left and the way out. */
function TrialCard({ trialEndsAt }: { trialEndsAt: string }) {
  const daysLeft = Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86_400_000));
  const used = Math.min(1, Math.max(0, (TRIAL_DAYS - daysLeft) / TRIAL_DAYS));
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-bg-elevated-2 p-3.5">
      <p className="text-[13px] font-extrabold text-fg">
        Teste PRO · {daysLeft} {daysLeft === 1 ? "dia" : "dias"}
      </p>
      <div className="h-1.5 rounded-full bg-white/10" aria-hidden>
        <div className="h-1.5 rounded-full bg-primary" style={{ width: `${used * 100}%` }} />
      </div>
      <Link to="/assinatura" className="text-[13px] font-bold text-primary-text hover:underline">
        Escolher plano
      </Link>
    </div>
  );
}

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
    "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition " +
    (isActive ? "bg-bg-elevated-2 font-bold text-fg" : "font-semibold text-fg-muted hover:bg-white/5 hover:text-fg")
  );
}

function NavGroup({ label, items }: { label?: string; items: NavItem[] }) {
  return (
    <>
      {label && <p className="mt-5 mb-1 px-3 text-[11px] font-bold uppercase tracking-widest text-fg-muted/80">{label}</p>}
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
    <div className="flex min-h-screen flex-col bg-bg md:flex-row">
      <aside className="flex shrink-0 flex-col justify-between border-b border-border bg-bg-sidebar p-4 md:w-60 md:border-r md:border-b-0">
        <div className="flex flex-col gap-5">
          <Logo className="px-2 text-[22px]" />

          <nav aria-label="Menu" className="flex flex-col gap-1">
            <NavGroup items={MAIN_ITEMS} />
            <NavGroup label="Conta" items={CONTA_ITEMS} />
            {isSuperadmin(user) && (
              <>
                <p className="mt-5 mb-1 flex items-center gap-1.5 px-3 text-[11px] font-bold uppercase tracking-widest text-fg-muted/80">
                  <ShieldCheck size={13} /> Administração
                </p>
                <NavGroup items={ADMIN_ITEMS} />
              </>
            )}
          </nav>
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-border pt-4">
          {user?.trialEndsAt && <TrialCard trialEndsAt={user.trialEndsAt} />}
          <p className="truncate px-3 text-sm text-fg-muted">
            {user?.name}
            <span className={"ml-2 text-[11px] font-bold " + (user?.planKey === "PRO" ? "text-emerald-400" : "text-fg-muted/70")}>
              {user?.planKey}
            </span>
            {isSuperadmin(user) && <span className="ml-2 text-[11px] font-bold text-primary-text">superadmin</span>}
          </p>
          <button
            onClick={handleLogout}
            className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-left text-[15px] font-semibold text-fg-muted transition hover:bg-white/5 hover:text-fg"
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
