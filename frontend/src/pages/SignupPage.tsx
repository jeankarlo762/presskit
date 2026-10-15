import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupInput } from "@presskit/shared";
import { signup, type loginWithGoogle } from "../api/auth";
import { apiErrorMessage } from "../api/axios";
import { useAuthStore } from "../store/auth.store";
import { Button, FieldError, Input, Label } from "../components/ui";
import { AuthLayout } from "../components/auth/AuthLayout";

/** sessionStorage key carrying the plan chosen on the landing page through
 * signup → onboarding → /assinatura, so the pricing CTA ends in a checkout. */
export const CHOSEN_PLAN_KEY = "presskit-plano";

export function SignupPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    const plano = params.get("plano");
    if (plano) {
      try {
        sessionStorage.setItem(CHOSEN_PLAN_KEY, plano);
      } catch {
        // storage blocked — the user simply picks the plan again later
      }
    }
  }, [params]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });

  async function onSubmit(input: SignupInput) {
    setServerError(null);
    try {
      const session = await signup(input);
      setSession(session);
      navigate("/onboarding");
    } catch (error) {
      setServerError(apiErrorMessage(error, "Não foi possível criar a conta"));
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
          <Label>Nome artístico</Label>
          <Input autoComplete="name" placeholder="Como você aparece nos cartazes" {...register("name")} />
          <FieldError>{errors.name?.message}</FieldError>
        </div>
        <div>
          <Label>E-mail</Label>
          <Input type="email" autoComplete="email" placeholder="voce@email.com" {...register("email")} />
          <FieldError>{errors.email?.message}</FieldError>
        </div>
        <div>
          <Label>Senha</Label>
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo de 8 caracteres"
            {...register("password")}
          />
          <FieldError>{errors.password?.message}</FieldError>
        </div>
        <FieldError>{serverError}</FieldError>
        <Button type="submit" disabled={isSubmitting} className="w-full py-3.5 text-base font-extrabold">
          {isSubmitting ? "Criando..." : "Criar conta grátis"}
        </Button>
      </form>
    </AuthLayout>
  );
}
