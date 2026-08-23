import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@presskit/shared";
import { login } from "../api/auth";
import { useAuthStore } from "../store/auth.store";
import { Button, Card, FieldError, GrainOverlay, Input, Label, Logo } from "../components/ui";

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(input: LoginInput) {
    setServerError(null);
    try {
      const session = await login(input);
      setSession(session);
      navigate("/");
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "E-mail ou senha inválidos");
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden px-4">
      <GrainOverlay />
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-[120px]"
        style={{ background: "radial-gradient(closest-side, var(--violet), transparent)" }}
        aria-hidden
      />
      <Logo className="relative text-2xl" />
      <Card className="relative w-full max-w-sm">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-fg">Entrar</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <Label>E-mail</Label>
            <Input type="email" {...register("email")} />
            <FieldError>{errors.email?.message}</FieldError>
          </div>
          <div>
            <Label>Senha</Label>
            <Input type="password" {...register("password")} />
            <FieldError>{errors.password?.message}</FieldError>
          </div>
          <FieldError>{serverError}</FieldError>
          <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
            {isSubmitting ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </Card>
      <p className="relative text-sm text-fg-muted">
        Não tem conta?{" "}
        <Link to="/signup" className="font-medium text-fg underline underline-offset-2">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
