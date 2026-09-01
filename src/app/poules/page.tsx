"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";
import { request } from "@/lib/api-client";
import { formatBRL, formatDateBR } from "@/lib/format";
import { potentialPayout } from "@/lib/betting";
import type { ModalityId } from "@/lib/modalities";

const PAYMENT_LABEL: Record<string, string> = { PIX: "Pix", DINHEIRO: "Dinheiro", CARTAO: "Cartão", FIADO: "Fiado" };

type PouleApi = {
  id: string;
  code: string;
  total: string;
  status: "AGUARDANDO" | "BATIDO" | "PERDIDO";
  draw: { lottery: string; date: string; time: string };
  cambistaClient: { name: string } | null;
  paymentMethod: string | null;
  bets: {
    id: string;
    modality: string;
    numbers: string[];
    prizeFrom: number;
    prizeTo: number;
    total: string;
    unitValue: string;
  }[];
};

export default function PoulesPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [poules, setPoules] = useState<PouleApi[] | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!token) return;
    const id = setTimeout(() => {
      request<{ poules: PouleApi[] }>("/api/poules", { token }).then((data) => setPoules(data.poules));
    }, 0);
    return () => clearTimeout(id);
  }, [token]);

  if (!user) return null;

  const abertos = poules?.filter((p) => p.status === "AGUARDANDO") ?? null;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-black">Meus Pôules</h1>

      {abertos === null && <p className="text-sm text-muted">Carregando...</p>}

      {abertos !== null && abertos.length === 0 && (
        <Card className="text-center text-muted">
          Nenhum pôule em aberto.{" "}
          <Link href="/" className="text-gold">
            Montar um pôule
          </Link>
        </Card>
      )}

      <div className="space-y-3">
        {abertos?.map((p) => (
          <Card key={p.id}>
            <div className="flex items-center justify-between">
              <div>
                <b className="font-mono text-gold">{p.code}</b>
                <p className="mt-1 text-sm text-muted">
                  {p.draw.lottery} • {formatDateBR(p.draw.date.slice(0, 10))} • {p.draw.time}
                </p>
                {p.cambistaClient && (
                  <p className="mt-0.5 text-xs text-gold">Cliente: {p.cambistaClient.name}</p>
                )}
                {p.paymentMethod && (
                  <p className={`mt-0.5 text-xs ${p.paymentMethod === "FIADO" ? "text-danger" : "text-muted"}`}>
                    Pagamento: {PAYMENT_LABEL[p.paymentMethod] ?? p.paymentMethod}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-black">{formatBRL(Number(p.total))}</p>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs font-bold text-muted">AGUARDANDO</span>
              </div>
            </div>
            <div className="mt-3 space-y-1 border-t border-line-soft pt-3 text-sm">
              {p.bets.map((b) => (
                <p key={b.id} className="text-muted">
                  <b className="text-text">{b.modality}</b> — {b.numbers.join(", ")} ({b.prizeFrom}º ao {b.prizeTo}º)
                  — {formatBRL(Number(b.total))} · possível ganho:{" "}
                  <b className="text-gold">{formatBRL(potentialPayout(Number(b.unitValue), b.modality as ModalityId))}</b>
                </p>
              ))}
            </div>
            <Link
              href={`/poules/${p.id}/bilhete`}
              className="mt-3 block rounded-lg border border-line bg-panel-2 py-2 text-center text-xs font-bold text-gold hover:bg-white/5"
            >
              Ver bilhete (imprimir / compartilhar)
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
