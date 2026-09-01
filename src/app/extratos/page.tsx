"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Card from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";
import { request } from "@/lib/api-client";
import { formatBRL } from "@/lib/format";

type Transacao = { id: string; kind: string; amount: string; description: string; createdAt: string };

const KIND_LABEL: Record<string, string> = {
  DEPOSITO_PIX: "Depósito Pix",
  DEPOSITO_SIMULADO: "Depósito",
  SAQUE_SIMULADO: "Saque",
  APOSTA: "Aposta",
  PREMIO: "Prêmio",
};

const FILTROS = [
  { label: "Todas", value: "" },
  { label: "Depósitos", value: "DEPOSITO" },
  { label: "Saques", value: "SAQUE_SIMULADO" },
  { label: "Apostas", value: "APOSTA" },
  { label: "Prêmios", value: "PREMIO" },
];

export default function ExtratosPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [extrato, setExtrato] = useState<Transacao[] | null>(null);
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!token) return;
    const id = setTimeout(() => {
      request<{ extrato: Transacao[] }>("/api/carteira", { token }).then((d) => setExtrato(d.extrato));
    }, 0);
    return () => clearTimeout(id);
  }, [token]);

  if (!user) return null;

  const filtrado = extrato?.filter((t) => !filtro || t.kind === filtro || (filtro === "DEPOSITO" && t.kind.startsWith("DEPOSITO")));

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-black">Extratos</h1>
      <p className="mb-6 text-sm text-muted">Histórico completo de tudo que movimentou sua conta.</p>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.label}
            onClick={() => setFiltro(f.value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
              filtro === f.value ? "border-gold bg-gold text-navy" : "border-line bg-panel-2 text-muted hover:border-[#3c6da8]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {extrato === null && <p className="text-sm text-muted">Carregando...</p>}
      {filtrado !== undefined && filtrado.length === 0 && (
        <Card className="text-center text-muted">Nenhuma movimentação encontrada.</Card>
      )}

      <div className="space-y-2">
        {filtrado?.map((t) => {
          const amount = Number(t.amount);
          const isPix = t.kind.startsWith("DEPOSITO") || t.kind === "SAQUE_SIMULADO";
          const isSaque = t.kind === "SAQUE_SIMULADO";
          return (
            <div key={t.id} className="flex items-center gap-3 rounded-lg border border-line bg-panel-2 p-3 text-sm">
              {isPix && (
                <Image
                  src={isSaque ? "/pix-vermelho.png" : "/pix-verde.png"}
                  alt={isSaque ? "Saque" : "Depósito"}
                  width={32}
                  height={32}
                  className="size-8 shrink-0 object-contain"
                />
              )}
              <div className="min-w-0 flex-1">
                <b>{KIND_LABEL[t.kind] ?? t.kind}</b>
                <p className="text-xs text-muted">
                  {t.description} · {new Date(t.createdAt).toLocaleString("pt-BR")}
                </p>
              </div>
              <b className={`shrink-0 ${amount >= 0 ? "text-win" : "text-loss"}`}>
                {amount >= 0 ? "+" : ""}
                {formatBRL(amount)}
              </b>
            </div>
          );
        })}
      </div>
    </div>
  );
}
