import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPasswordSchema, resetPasswordSchema } from "@presskit/shared";
import { requestPasswordReset, resetPassword } from "../api/auth";
import { apiErrorMessage } from "../api/axios";
import { Button, FieldError, Input, Label } from "../components/ui";
import { AuthLayout } from "../components/auth/AuthLayout";

type Step = "email" | "code" | "done";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  async function sendCode(event?: FormEvent) {
    event?.preventDefault();
    setError(null);
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError("Informe um e-mail válido");
      return;
    }
    setBusy(true);
    try {
      await requestPasswordReset(parsed.data.email);
      setEmail(parsed.data.email);
      setResent(step === "code");
      setStep("code");
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível enviar o código — tente de novo em instantes"));
    } finally {
      setBusy(false);
    }
  }

  async function submitReset(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("As senhas não conferem");
      return;
    }
    const parsed = resetPasswordSchema.safeParse({ email, code, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Confira os dados");
      return;
    }
    setBusy(true);
    try {
      await resetPassword(parsed.data);
      setStep("done");
    } catch (err) {
      setError(apiErrorMessage(err, "Código inválido ou expirado"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout hideTabs>
      {step === "email" && (
        <form onSubmit={sendCode} className="flex flex-col gap-5" noValidate>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-fg">Esqueci minha senha</h2>
            <p className="mt-1 text-sm text-fg-muted">
              Informe o e-mail da sua conta. Se ele estiver cadastrado, enviamos um código de 6 dígitos.
            </p>
          </div>
          <div>
            <Label>E-mail</Label>
            <Input
              type="email"
              autoComplete="email"
              placeholder="voce@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>
          <FieldError>{error}</FieldError>
          <Button type="submit" disabled={busy} className="w-full py-3.5 text-base font-extrabold">
            {busy ? "Enviando..." : "Enviar código"}
          </Button>
          <p className="text-center text-sm text-fg-muted">
            Lembrou a senha?{" "}
            <Link to="/login" className="font-bold text-fg hover:underline">
              Entrar
            </Link>
          </p>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={submitReset} className="flex flex-col gap-5" noValidate>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-fg">Digite o código</h2>
            <p className="mt-1 text-sm text-fg-muted">
              Se <span className="text-fg">{email}</span> tiver uma conta, o código chega em instantes e vale por 15
              minutos.
            </p>
          </div>
          <div>
            <Label>Código de 6 dígitos</Label>
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="text-center text-xl tracking-[0.5em]"
              autoFocus
            />
          </div>
          <div>
            <Label>Nova senha</Label>
            <Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <Label>Confirmar nova senha</Label>
            <Input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          <FieldError>{error}</FieldError>
          <Button type="submit" disabled={busy || code.length !== 6} className="w-full py-3.5 text-base font-extrabold">
            {busy ? "Salvando..." : "Redefinir senha"}
          </Button>
          <div className="flex items-center justify-between text-sm text-fg-muted">
            <button type="button" onClick={() => void sendCode()} disabled={busy} className="font-bold hover:text-fg">
              {resent ? "Código reenviado" : "Reenviar código"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setError(null);
              }}
              className="hover:text-fg"
            >
              Trocar e-mail
            </button>
          </div>
        </form>
      )}

      {step === "done" && (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-fg">Senha redefinida</h2>
            <p className="mt-1 text-sm text-fg-muted">
              Por segurança, todas as sessões anteriores foram encerradas. Entre com a nova senha.
            </p>
          </div>
          <Button onClick={() => navigate("/login")} className="w-full py-3.5 text-base font-extrabold">
            Ir para o login
          </Button>
        </div>
      )}
    </AuthLayout>
  );
}
