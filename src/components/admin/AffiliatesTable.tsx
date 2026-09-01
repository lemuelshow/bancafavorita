"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { request } from "@/lib/api-client";
import { formatBRL } from "@/lib/format";

type AffiliateRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  affiliateCpa: number;
  affiliateRevPct: number;
  referralCode: string | null;
  referralCount: number;
  cpaTotal: number;
  revTotal: number;
};

export default function AffiliatesTable() {
  const { token } = useAuth();
  const [affiliates, setAffiliates] = useState<AffiliateRow[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { cpa: string; rev: string }>>({});
  const [salvandoId, setSalvandoId] = useState<string | null>(null);

  async function carregar() {
    if (!token) return;
    const data = await request<{ affiliates: AffiliateRow[] }>("/api/admin/affiliates", { token });
    setAffiliates(data.affiliates);
    setDrafts(
      Object.fromEntries(
        data.affiliates.map((a) => [a.id, { cpa: String(a.affiliateCpa), rev: String(a.affiliateRevPct) }])
      )
    );
  }

  useEffect(() => {
    if (!token) return;
    const id = setTimeout(carregar, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function salvar(a: AffiliateRow) {
    const draft = drafts[a.id];
    setSalvandoId(a.id);
    try {
      await request(`/api/admin/affiliates/${a.id}`, {
        method: "POST",
        token,
        body: JSON.stringify({ affiliateCpa: Number(draft.cpa), affiliateRevPct: Number(draft.rev) }),
      });
      await carregar();
    } finally {
      setSalvandoId(null);
    }
  }

  if (affiliates === null) return <p className="text-sm text-muted">Carregando...</p>;

  if (affiliates.length === 0) {
    return (
      <Card className="text-center text-muted">
        Nenhum afiliado ainda. Torne um usuário afiliado na aba{" "}
        <span className="font-bold text-gold">Usuários</span>.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {affiliates.map((a) => (
        <Card key={a.id}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <b>{a.name}</b>
              <p className="text-xs text-muted">
                {a.phone} · {a.email ?? "sem e-mail"} · código{" "}
                <span className="font-mono text-gold">{a.referralCode}</span>
              </p>
            </div>
            <div className="flex gap-4 text-xs text-muted">
              <span>
                Indicados: <b className="text-text">{a.referralCount}</b>
              </span>
              <span>
                CPA pago: <b className="text-gold">{formatBRL(a.cpaTotal)}</b>
              </span>
              <span>
                REV pago: <b className="text-gold">{formatBRL(a.revTotal)}</b>
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-[#c9d8ed]">CPA por cadastro (R$)</span>
              <input
                inputMode="decimal"
                value={drafts[a.id]?.cpa ?? ""}
                onChange={(e) => setDrafts((d) => ({ ...d, [a.id]: { ...d[a.id], cpa: e.target.value } }))}
                className="w-full rounded-lg border border-[#2d619f] bg-panel-2 p-3"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-[#c9d8ed]">REV share (%)</span>
              <input
                inputMode="decimal"
                value={drafts[a.id]?.rev ?? ""}
                onChange={(e) => setDrafts((d) => ({ ...d, [a.id]: { ...d[a.id], rev: e.target.value } }))}
                className="w-full rounded-lg border border-[#2d619f] bg-panel-2 p-3"
              />
            </label>
            <Button disabled={salvandoId === a.id} onClick={() => salvar(a)}>
              {salvandoId === a.id ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
