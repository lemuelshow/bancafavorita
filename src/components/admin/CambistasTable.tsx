"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { request } from "@/lib/api-client";
import { formatBRL } from "@/lib/format";

type CambistaRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  cambistaCommissionPct: number;
  cambistaCode: string | null;
  playerCount: number;
  commissionTotal: number;
};

export default function CambistasTable() {
  const { token } = useAuth();
  const [cambistas, setCambistas] = useState<CambistaRow[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [salvandoId, setSalvandoId] = useState<string | null>(null);

  async function carregar() {
    if (!token) return;
    const data = await request<{ cambistas: CambistaRow[] }>("/api/admin/cambistas", { token });
    setCambistas(data.cambistas);
    setDrafts(Object.fromEntries(data.cambistas.map((c) => [c.id, String(c.cambistaCommissionPct)])));
  }

  useEffect(() => {
    if (!token) return;
    const id = setTimeout(carregar, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function salvar(c: CambistaRow) {
    setSalvandoId(c.id);
    try {
      await request(`/api/admin/cambistas/${c.id}`, {
        method: "POST",
        token,
        body: JSON.stringify({ cambistaCommissionPct: Number(drafts[c.id]) }),
      });
      await carregar();
    } finally {
      setSalvandoId(null);
    }
  }

  if (cambistas === null) return <p className="text-sm text-muted">Carregando...</p>;

  if (cambistas.length === 0) {
    return (
      <Card className="text-center text-muted">
        Nenhum cambista ainda. Torne um usuário cambista na aba{" "}
        <span className="font-bold text-gold">Usuários</span>.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {cambistas.map((c) => (
        <Card key={c.id}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <b>{c.name}</b>
              <p className="text-xs text-muted">
                {c.phone} · {c.email ?? "sem e-mail"} · código{" "}
                <span className="font-mono text-gold">{c.cambistaCode}</span>
              </p>
            </div>
            <div className="flex gap-4 text-xs text-muted">
              <span>
                Jogadores: <b className="text-text">{c.playerCount}</b>
              </span>
              <span>
                Comissão paga: <b className="text-gold">{formatBRL(c.commissionTotal)}</b>
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-[#c9d8ed]">Comissão sobre o valor apostado (%)</span>
              <input
                inputMode="decimal"
                value={drafts[c.id] ?? ""}
                onChange={(e) => setDrafts((d) => ({ ...d, [c.id]: e.target.value }))}
                className="w-full rounded-lg border border-[#2d619f] bg-panel-2 p-3"
              />
            </label>
            <Button disabled={salvandoId === c.id} onClick={() => salvar(c)}>
              {salvandoId === c.id ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
