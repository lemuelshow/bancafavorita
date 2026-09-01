"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";
import { request } from "@/lib/api-client";
import { formatBRL, iniciais } from "@/lib/format";

type Transacao = { id: string; kind: string; amount: string; description: string; user: { name: string } };

type DashboardApi = {
  clientCount: number;
  totalBalance: number;
  hoje: { novosCadastros: number; depositado: number; apostado: number };
  ultimasTransacoes: Transacao[];
};

const KIND_LABEL: Record<string, string> = {
  DEPOSITO_PIX: "Depósito Pix",
  DEPOSITO_SIMULADO: "Depósito",
  SAQUE_SIMULADO: "Saque",
  APOSTA: "Aposta",
  PREMIO: "Prêmio",
};

export default function ResumoAdmin() {
  const { user, token } = useAuth();
  const [data, setData] = useState<DashboardApi | null>(null);

  useEffect(() => {
    if (!token) return;
    const id = setTimeout(() => {
      request<DashboardApi>("/api/admin/dashboard", { token }).then(setData);
    }, 0);
    return () => clearTimeout(id);
  }, [token]);

  if (!user || !data) {
    return (
      <div className="space-y-4">
        <Card className="text-center text-sm text-muted">Carregando...</Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gold/15 text-lg font-black text-gold">
            {iniciais(user.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-black">Olá, {user.name.split(" ")[0]}!</p>
            <p className="text-xs text-muted">⌂ Administrador</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-lg bg-panel-2 p-2.5">
            <b className="block text-lg text-gold">{data.clientCount}</b>
            <span className="text-[11px] text-muted">Clientes</span>
          </div>
          <div className="rounded-lg bg-panel-2 p-2.5">
            <b className="block text-lg text-gold">{formatBRL(data.totalBalance)}</b>
            <span className="text-[11px] text-muted">Em carteiras</span>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 font-black">Resumo de hoje</h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-panel-2 p-2.5">
            <b className="block text-xl text-gold">{data.hoje.novosCadastros}</b>
            <span className="text-[11px] text-muted">Cadastros</span>
          </div>
          <div className="rounded-lg bg-panel-2 p-2.5">
            <b className="block text-lg text-win">{formatBRL(data.hoje.depositado)}</b>
            <span className="text-[11px] text-muted">Depositado</span>
          </div>
          <div className="rounded-lg bg-panel-2 p-2.5">
            <b className="block text-lg text-gold">{formatBRL(data.hoje.apostado)}</b>
            <span className="text-[11px] text-muted">Apostado</span>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 font-black">Últimas movimentações</h3>
        {data.ultimasTransacoes.length === 0 ? (
          <p className="text-center text-sm text-muted">Nenhuma movimentação ainda.</p>
        ) : (
          <div className="space-y-2">
            {data.ultimasTransacoes.map((t) => {
              const amount = Number(t.amount);
              return (
                <div key={t.id} className="flex items-center justify-between text-sm">
                  <div className="min-w-0 pr-2">
                    <p className="truncate font-bold">{t.user.name}</p>
                    <p className="text-xs text-muted">{KIND_LABEL[t.kind] ?? t.kind}</p>
                  </div>
                  <b className={`shrink-0 ${amount >= 0 ? "text-win" : "text-loss"}`}>
                    {amount >= 0 ? "+" : ""}
                    {formatBRL(amount)}
                  </b>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
