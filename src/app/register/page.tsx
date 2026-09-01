"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Field from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import AuthBrandPanel from "@/components/auth/AuthBrandPanel";
import { formatCpf } from "@/lib/cpf";
import { useAuth } from "@/contexts/AuthContext";

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") ?? undefined;
  const cambista = searchParams.get("cambista") ?? undefined;
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await register({ name, cpf, phone, email, password, ref, cambista });
      router.push("/");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível criar sua conta.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-[920px] flex-col items-center justify-center gap-5 lg:flex-row lg:items-start lg:justify-center">
      <AuthBrandPanel variant="register" />

      <Card className="h-auto w-full max-w-[440px] lg:h-[660px] lg:shrink-0">
        <span className="text-[11px] font-black tracking-[0.12em] text-gold uppercase">Cadastro</span>
        <h2 className="mt-2 mb-4 text-2xl font-black">Criar conta</h2>
        {ref && <p className="mb-3 text-xs text-muted">Você foi convidado por um afiliado.</p>}
        {cambista && <p className="mb-3 text-xs text-muted">Você foi indicado por um cambista.</p>}

        <form onSubmit={onSubmit} autoComplete="on">
          <Field label="Nome completo" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          <Field
            label="CPF"
            required
            inputMode="numeric"
            autoComplete="off"
            value={cpf}
            onChange={(e) => setCpf(formatCpf(e.target.value))}
            placeholder="000.000.000-00"
          />
          <Field
            label="Celular"
            required
            inputMode="numeric"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(00) 00000-0000"
          />
          <Field
            label="E-mail (opcional)"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
          />
          <Field
            label="Senha"
            required
            type={mostrarSenha ? "text" : "password"}
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
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
            {enviando ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          Já tem conta?{" "}
          <Link href="/login" className="text-gold">
            Entrar
          </Link>
        </p>
      </Card>
    </div>
  );
}
