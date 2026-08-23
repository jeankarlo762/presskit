import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupInput } from "@presskit/shared";
import { signup } from "../api/auth";
import { useAuthStore } from "../store/auth.store";
import { Button, Card, FieldError, Input, Label } from "../components/ui";

export function SignupPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [serverError, setServerError] = useState<string | null>(null);

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
      setServerError(error instanceof Error ? error.message : "Não foi possível criar a conta");
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-50 px-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Criar conta</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <Label>Nome</Label>
            <Input {...register("name")} />
            <FieldError>{errors.name?.message}</FieldError>
          </div>
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
            {isSubmitting ? "Criando..." : "Criar conta"}
          </Button>
        </form>
      </Card>
      <p className="text-sm text-neutral-500">
        Já tem conta?{" "}
        <Link to="/login" className="font-medium text-neutral-900 underline underline-offset-2">
          Entrar
        </Link>
      </p>
    </div>
  );
}
