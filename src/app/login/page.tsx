"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Field from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import AuthBrandPanel from "@/components/auth/AuthBrandPanel";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const user = await login(loginValue, password);
      router.push(user.isAdmin ? "/admin" : "/");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível entrar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-[920px] flex-col items-center justify-center gap-5 lg:flex-row lg:items-start lg:justify-center">
      <AuthBrandPanel variant="login" />

      <Card className="flex h-auto w-full max-w-[440px] flex-col justify-center lg:h-[660px] lg:shrink-0">
        <span className="text-[11px] font-black tracking-[0.12em] text-gold uppercase">Entrar</span>
        <h2 className="mt-2 mb-4 text-2xl font-black">Acesse sua conta</h2>

        <form onSubmit={onSubmit} autoComplete="on">
          <Field
            label="E-mail ou celular"
            required
            autoComplete="username"
            value={loginValue}
            onChange={(e) => setLoginValue(e.target.value)}
            placeholder="voce@email.com ou (00) 00000-0000"
          />
          <Field
            label="Senha"
            required
            type={mostrarSenha ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            trailing={
              <button
                type="button"
                onClick={() => setMostrarSenha((v) => !v)}
                className="text-xs font-bold text-muted hover:text-gold"
                tabIndex={-1}
              >
                {mostrarSenha ? "OCULTAR" : "MOSTRAR"}
              </button>
            }
          />

          {erro && <p className="mb-3 text-sm text-danger">{erro}</p>}

          <Button type="submit" size="lg" className="w-full" disabled={enviando}>
            {enviando ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          Ainda não tem conta?{" "}
          <Link href="/register" className="text-gold">
            Cadastrar
          </Link>
        </p>
      </Card>
    </div>
  );
}
