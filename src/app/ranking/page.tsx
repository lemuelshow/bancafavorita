"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";
import { request } from "@/lib/api-client";
import { formatBRL } from "@/lib/format";
import type { WinnerRanking } from "@/lib/ranking";

const MEDALHA = ["🥇", "🥈", "🥉"];

export default function RankingPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [winners, setWinners] = useState<WinnerRanking[] | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!token) return;
    const id = setTimeout(() => {
      request<{ winners: WinnerRanking[] }>("/api/dashboard/ranking", { token }).then((d) => setWinners(d.winners));
    }, 0);
    return () => clearTimeout(id);
  }, [token]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-black">Ranking de ganhadores</h1>
      <p className="mb-6 text-sm text-muted">Maiores ganhadores da Banca Favorita, por total já recebido em prêmios.</p>

      {winners === null && <p className="text-sm text-muted">Carregando...</p>}
      {winners !== null && winners.length === 0 && (
        <Card className="text-center text-muted">Ainda não há ganhadores registrados.</Card>
      )}

      <div className="space-y-2">
        {winners?.map((w, i) => (
          <div key={w.userId} className="flex items-center justify-between rounded-xl border border-line bg-panel p-4">
            <div className="flex items-center gap-3">
              <span className="w-7 text-center text-lg">{MEDALHA[i] ?? i + 1}</span>
              <b>{w.name}</b>
            </div>
            <b className="text-win">{formatBRL(w.total)}</b>
          </div>
        ))}
      </div>
    </div>
  );
}
