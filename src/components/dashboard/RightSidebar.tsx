"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";
import { request } from "@/lib/api-client";
import UserLevelCard from "@/components/dashboard/UserLevelCard";
import BetSummaryCard from "@/components/dashboard/BetSummaryCard";
import TopWinnersCard from "@/components/dashboard/TopWinnersCard";
import TransactionsCard from "@/components/dashboard/TransactionsCard";
import type { UltimaAposta } from "@/components/dashboard/OpenBetCard";
import type { Transacao } from "@/components/dashboard/TransactionsCard";
import type { WinnerRanking } from "@/lib/ranking";

type Resumo = {
  name: string;
  xp: number;
  resumoApostas: { abertas: number; ganhouHoje: number; perdeuHoje: number };
  ultimaAposta: UltimaAposta | null;
  transacoes: Transacao[];
  topWinners: WinnerRanking[];
};

export default function RightSidebar({ className = "" }: { className?: string }) {
  const { token } = useAuth();
  const [data, setData] = useState<Resumo | null>(null);
  const [erro, setErro] = useState(false);

  async function carregar() {
    if (!token) return;
    setErro(false);
    try {
      const d = await request<Resumo>("/api/dashboard/resumo", { token });
      setData(d);
    } catch {
      setErro(true);
    }
  }

  useEffect(() => {
    if (!token) return;
    const id = setTimeout(carregar, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (erro) {
    return (
      <div className={className}>
        <Card className="text-center text-sm">
          <p className="text-danger">Não foi possível carregar seu painel.</p>
          <button onClick={carregar} className="mt-2 font-bold text-gold hover:underline">
            Tentar de novo
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {data ? <UserLevelCard name={data.name} xp={data.xp} /> : <UserLevelCard loading />}
      {data ? (
        <BetSummaryCard resumo={data.resumoApostas} ultimaAposta={data.ultimaAposta} />
      ) : (
        <BetSummaryCard loading />
      )}
      {data ? <TopWinnersCard winners={data.topWinners} /> : <TopWinnersCard loading />}
      {data ? <TransactionsCard transacoes={data.transacoes} /> : <TransactionsCard loading />}
    </div>
  );
}
