"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { request } from "@/lib/api-client";
import { formatBRL } from "@/lib/format";

type AffiliateData = {
  referralCode: string | null;
  affiliateCpa: number;
  affiliateRevPct: number;
  referralCount: number;
  cpaTotal: number;
  revTotal: number;
  total: number;
  earnings: { id: string; kind: string; amount: string; description: string; createdAt: string }[];
};

export default function AfiliadoPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<AffiliateData | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (!user.isAffiliate) router.replace("/");
  }, [loading, user, router]);

  useEffect(() => {
    if (!token || !user?.isAffiliate) return;
    const id = setTimeout(() => {
      request<AffiliateData>("/api/affiliate/me", { token }).then(setData);
    }, 0);
    return () => clearTimeout(id);
  }, [token, user]);

  if (!user?.isAffiliate) return null;

  const link = data?.referralCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/register?ref=${data.referralCode}`
    : "";

  function copiarLink() {
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-black">Área do Afiliado</h1>
      <p className="mb-6 text-sm text-muted">
        Indique novos jogadores com seu link e acompanhe suas comissões de CPA e REV.
      </p>

      <Card className="mb-6">
        <span className="mb-1.5 block text-[13px] font-bold text-[#c9d8ed]">Seu link de indicação</span>
        <div className="flex gap-2">
          <input readOnly value={link} className="w-full rounded-lg border border-[#2d619f] bg-panel-2 p-3 text-sm" />
          <Button onClick={copiarLink}>{copiado ? "Copiado!" : "Copiar"}</Button>
        </div>
        <p className="mt-3 text-xs text-muted">
          CPA por cadastro: <b className="text-gold">{formatBRL(data?.affiliateCpa ?? 0)}</b> · REV share:{" "}
          <b className="text-gold">{data?.affiliateRevPct ?? 0}%</b>
        </p>
      </Card>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <span className="block text-xs text-muted">Indicados</span>
          <b className="mt-1.5 block text-2xl text-gold">{data?.referralCount ?? "..."}</b>
        </Card>
        <Card>
          <span className="block text-xs text-muted">Total em CPA</span>
          <b className="mt-1.5 block text-2xl text-gold">{data ? formatBRL(data.cpaTotal) : "..."}</b>
        </Card>
        <Card>
          <span className="block text-xs text-muted">Total em REV</span>
          <b className="mt-1.5 block text-2xl text-gold">{data ? formatBRL(data.revTotal) : "..."}</b>
        </Card>
        <Card>
          <span className="block text-xs text-muted">Total geral</span>
          <b className="mt-1.5 block text-2xl text-gold">{data ? formatBRL(data.total) : "..."}</b>
        </Card>
      </div>

      <h2 className="mb-3 text-lg font-black">Comissões</h2>
      {data && data.earnings.length === 0 && <Card className="text-center text-muted">Nenhuma comissão ainda.</Card>}
      <div className="space-y-2">
        {data?.earnings.map((e) => (
          <div key={e.id} className="flex items-center justify-between rounded-lg border border-line bg-panel-2 p-3 text-sm">
            <div>
              <b>{e.kind === "CPA" ? "CPA" : "Revenue Share"}</b>
              <p className="text-muted">{e.description}</p>
            </div>
            <b className="text-gold">{formatBRL(Number(e.amount))}</b>
          </div>
        ))}
      </div>
    </div>
  );
}
