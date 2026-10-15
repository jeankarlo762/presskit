import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@presskit/shared";
import { login, type loginWithGoogle } from "../api/auth";
import { apiErrorMessage } from "../api/axios";
import { useAuthStore } from "../store/auth.store";
import { Button, FieldError, Input, Label } from "../components/ui";
import { AuthLayout } from "../components/auth/AuthLayout";

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
      setServerError(apiErrorMessage(error, "E-mail ou senha inválidos"));
    }
  }

  function onGoogleSuccess(session: Awaited<ReturnType<typeof loginWithGoogle>>) {
    setSession(session);
    navigate(session.isNewUser ? "/onboarding" : "/");
  }

  return (
    <AuthLayout onGoogleSuccess={onGoogleSuccess} onGoogleError={setServerError}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        <div>
          <Label>E-mail</Label>
          <Input type="email" autoComplete="email" placeholder="voce@email.com" {...register("email")} />
          <FieldError>{errors.email?.message}</FieldError>
        </div>
        <div>
          <Label>Senha</Label>
          <Input type="password" autoComplete="current-password" {...register("password")} />
          <FieldError>{errors.password?.message}</FieldError>
        </div>
        <FieldError>{serverError}</FieldError>
        <Button type="submit" disabled={isSubmitting} className="w-full py-3.5 text-base font-extrabold">
          {isSubmitting ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </AuthLayout>
  );
}
