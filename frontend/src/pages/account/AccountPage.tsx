import { useEffect, useState, type FormEvent } from "react";
import { changePasswordSchema, updateProfileSchema } from "@presskit/shared";
import { changePassword, fetchMe, updateProfile, type AccountUser } from "../../api/auth";
import { apiErrorMessage } from "../../api/axios";
import { useAuthStore } from "../../store/auth.store";
import { Button, FieldError, Input, Label } from "../../components/ui";

const sectionClassName = "flex flex-col gap-4 rounded-2xl border border-border bg-bg-elevated p-5 sm:p-6";

function StatusPill({ connected }: { connected: boolean }) {
  return connected ? (
    <span className="shrink-0 rounded-full bg-[#0F2E22] px-2.5 py-1 text-xs font-extrabold text-[#6EE7B7]">
      Conectado
    </span>
  ) : (
    <span className="shrink-0 rounded-full bg-bg-elevated-2 px-2.5 py-1 text-xs font-extrabold text-fg-muted">
      Não conectado
    </span>
  );
}

function ProfileSection({ user, onSaved }: { user: AccountUser; onSaved: (user: AccountUser) => void }) {
  const [name, setName] = useState(user.name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    const parsed = updateProfileSchema.safeParse({ name });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Confira o nome");
      return;
    }
    setSaving(true);
    try {
      onSaved(await updateProfile(parsed.data));
      setSaved(true);
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível salvar"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={sectionClassName} noValidate>
      <h2 className="text-[17px] font-extrabold">Dados</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Nome</Label>
          <Input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
        </div>
        <div>
          <Label>E-mail</Label>
          <Input type="email" value={user.email} readOnly disabled aria-readonly />
        </div>
      </div>
      <FieldError>{error}</FieldError>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving || name.trim() === user.name}>
          {saving ? "Salvando..." : "Salvar"}
        </Button>
        {saved && <span className="text-sm text-fg-muted">Salvo.</span>}
      </div>
    </form>
  );
}

function PasswordForm({
  hasPassword,
  onSaved,
  onCancel,
}: {
  hasPassword: boolean;
  onSaved: (user: AccountUser) => void;
  onCancel: () => void;
}) {
  const setSession = useAuthStore((state) => state.setSession);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const parsed = changePasswordSchema.safeParse({
      newPassword,
      ...(hasPassword ? { currentPassword } : {}),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Confira a senha");
      return;
    }
    if (hasPassword && !currentPassword) {
      setError("Informe a senha atual");
      return;
    }
    if (newPassword !== confirm) {
      setError("As senhas não conferem");
      return;
    }
    setSaving(true);
    try {
      // The API signs out every other session and returns a fresh pair.
      const session = await changePassword(parsed.data);
      setSession(session);
      onSaved(session.user);
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível salvar a senha"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl bg-bg p-4" noValidate>
      {hasPassword && (
        <div>
          <Label>Senha atual</Label>
          <Input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Nova senha</Label>
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo de 8 caracteres"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </div>
        <div>
          <Label>Repita a nova senha</Label>
          <Input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </div>
      </div>
      <FieldError>{error}</FieldError>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Salvando..." : "Salvar senha"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function SignInMethodsSection({
  user,
  onPasswordSaved,
}: {
  user: AccountUser;
  onPasswordSaved: (user: AccountUser) => void;
}) {
  const [editingPassword, setEditingPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const hasGoogle = !!user.hasGoogle;
  const hasPassword = !!user.hasPassword;

  return (
    <section className={sectionClassName}>
      <h2 className="text-[17px] font-extrabold">Formas de entrar</h2>

      <div className="flex items-center gap-3.5 border-t border-border py-3">
        <span
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white font-extrabold text-[#1F1F1F]"
          aria-hidden
        >
          G
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <b className="text-[15px]">Google</b>
          <span className="text-[13px] text-fg-muted">
            {hasGoogle
              ? `Conectado como ${user.email}`
              : "Use “Continuar com Google” ao entrar, com este mesmo e-mail, para conectar"}
          </span>
        </div>
        <StatusPill connected={hasGoogle} />
      </div>

      <div className="flex flex-col gap-3 border-t border-border py-3">
        <div className="flex flex-wrap items-center gap-3.5">
          <span
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg-elevated-2 font-extrabold"
            aria-hidden
          >
            @
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <b className="text-[15px]">E-mail e senha</b>
            <span className="text-[13px] text-fg-muted">
              {passwordSaved
                ? "Senha salva. Outras sessões foram desconectadas."
                : hasPassword
                  ? `Você ${hasGoogle ? "também " : ""}entra com seu e-mail e senha`
                  : "Crie uma senha para entrar também sem o Google"}
            </span>
          </div>
          {!editingPassword && (
            <Button
              variant="secondary"
              onClick={() => {
                setPasswordSaved(false);
                setEditingPassword(true);
              }}
            >
              {hasPassword ? "Trocar senha" : "Definir senha"}
            </Button>
          )}
        </div>
        {editingPassword && (
          <PasswordForm
            hasPassword={hasPassword}
            onCancel={() => setEditingPassword(false)}
            onSaved={(updated) => {
              setEditingPassword(false);
              setPasswordSaved(true);
              onPasswordSaved(updated);
            }}
          />
        )}
      </div>
    </section>
  );
}

export function AccountPage() {
  const storedUser = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [user, setAccountUser] = useState<AccountUser | null>(storedUser);
  const [loadError, setLoadError] = useState<string | null>(null);

  function applyUser(updated: AccountUser) {
    setAccountUser(updated);
    setUser(updated);
  }

  // The stored user predates hasPassword/hasGoogle — re-read the profile.
  useEffect(() => {
    fetchMe()
      .then((me) => {
        setAccountUser(me);
        setUser(me);
      })
      .catch((err: unknown) => setLoadError(apiErrorMessage(err, "Não foi possível carregar sua conta")));
  }, [setUser]);

  return (
    <div className="mx-auto flex w-full max-w-[860px] flex-col gap-5 p-4 sm:p-6 lg:px-8">
      <h1 className="text-[26px] font-extrabold">Minha conta</h1>
      {loadError && <p className="text-sm text-red-400">{loadError}</p>}
      {user && (
        <>
          {/* keyed by name so a freshly loaded profile resets the field */}
          <ProfileSection key={user.name} user={user} onSaved={applyUser} />
          {user.hasPassword !== undefined && <SignInMethodsSection user={user} onPasswordSaved={applyUser} />}
        </>
      )}
    </div>
  );
}
