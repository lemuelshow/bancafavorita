"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { request } from "@/lib/api-client";
import { formatBRL, iniciais } from "@/lib/format";

type CambistaData = {
  cambistaCode: string | null;
  cambistaCommissionPct: number;
  playerCount: number;
  clientCount: number;
  total: number;
  earnings: { id: string; amount: string; description: string; createdAt: string }[];
};

export default function ResumoCambista() {
  const { user, token } = useAuth();
  const [data, setData] = useState<CambistaData | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!token) return;
    const id = setTimeout(() => {
      request<CambistaData>("/api/cambista/me", { token }).then(setData);
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

  const link = data.cambistaCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/register?cambista=${data.cambistaCode}`
    : "";

  function copiarLink() {
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
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
            <p className="text-xs text-muted">♜ Cambista</p>
          </div>
        </div>

        <div className="mt-4">
          <span className="mb-1.5 block text-[11px] font-bold text-muted">Seu link de indicação</span>
          <div className="flex gap-2">
            <input
              readOnly
              value={link}
              className="w-full truncate rounded-lg border border-[#2d619f] bg-panel-2 p-2 text-xs"
            />
            <Button size="sm" onClick={copiarLink}>
              {copiado ? "OK" : "Copiar"}
            </Button>
          </div>
        </div>

        <p className="mt-3 text-xs text-muted">
          Comissão sobre o valor apostado: <b className="text-gold">{data.cambistaCommissionPct}%</b>
        </p>
      </Card>

      <Card>
        <h3 className="mb-3 font-black">Minhas indicações</h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-panel-2 p-2.5">
            <b className="block text-xl text-gold">{data.playerCount}</b>
            <span className="text-[11px] text-muted">Jogadores</span>
          </div>
          <div className="rounded-lg bg-panel-2 p-2.5">
            <b className="block text-xl text-gold">{data.clientCount}</b>
            <span className="text-[11px] text-muted">Clientes</span>
          </div>
          <div className="rounded-lg bg-panel-2 p-2.5">
            <b className="block text-lg text-win">{formatBRL(data.total)}</b>
            <span className="text-[11px] text-muted">Comissão</span>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 font-black">Últimas comissões</h3>
        {data.earnings.length === 0 ? (
          <p className="text-center text-sm text-muted">Nenhuma comissão ainda.</p>
        ) : (
          <div className="space-y-2">
            {data.earnings.slice(0, 4).map((e) => (
              <div key={e.id} className="flex items-center justify-between text-sm">
                <p className="truncate pr-2 text-xs text-muted">{e.description}</p>
                <b className="shrink-0 text-gold">{formatBRL(Number(e.amount))}</b>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
