"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { request } from "@/lib/api-client";
import { formatBRL, formatDateBR } from "@/lib/format";
import { potentialPayout } from "@/lib/betting";
import type { ModalityId } from "@/lib/modalities";

type PouleDetalhe = {
  id: string;
  code: string;
  total: string;
  status: "AGUARDANDO" | "BATIDO" | "PERDIDO";
  createdAt: string;
  paymentMethod: string | null;
  draw: { lottery: string; date: string; time: string };
  cambistaClient: { name: string; phone: string } | null;
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

const PAYMENT_LABEL: Record<string, string> = { PIX: "Pix", DINHEIRO: "Dinheiro", CARTAO: "Cartão", FIADO: "Fiado" };
const STATUS_LABEL = { AGUARDANDO: "Aguardando resultado", BATIDO: "Ganhou", PERDIDO: "Não ganhou" } as const;

export default function BilhetePage() {
  const params = useParams<{ id: string }>();
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [poule, setPoule] = useState<PouleDetalhe | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!token) return;
    request<{ poule: PouleDetalhe }>(`/api/poules/${params.id}`, { token })
      .then((d) => setPoule(d.poule))
      .catch((err) => setErro(err instanceof Error ? err.message : "Não foi possível carregar o bilhete."));
  }, [token, params.id]);

  function textoCompartilhar(p: PouleDetalhe): string {
    const linhas = [
      `Bilhete Banca Favorita — ${p.code}`,
      `${p.draw.lottery} • ${formatDateBR(p.draw.date.slice(0, 10))} • ${p.draw.time}`,
      ...p.bets.map(
        (b) => `${b.modality}: ${b.numbers.join(", ")} (${b.prizeFrom}º ao ${b.prizeTo}º) — ${formatBRL(Number(b.total))}`
      ),
      `Total: ${formatBRL(Number(p.total))}`,
      `Status: ${STATUS_LABEL[p.status]}`,
    ];
    return linhas.join("\n");
  }

  async function compartilhar() {
    if (!poule) return;
    const texto = textoCompartilhar(poule);
    if (navigator.share) {
      try {
        await navigator.share({ title: `Bilhete ${poule.code}`, text: texto });
      } catch {
        // usuário cancelou o compartilhamento nativo — sem erro
      }
    } else {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  }

  if (erro) return <p className="mx-auto max-w-lg text-center text-sm text-danger">{erro}</p>;
  if (!poule) return <p className="mx-auto max-w-lg text-center text-sm text-muted">Carregando...</p>;

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex gap-2 print:hidden">
        <Button variant="secondary" className="w-full" onClick={() => window.print()}>
          Imprimir
        </Button>
        <Button className="w-full" onClick={compartilhar}>
          {copiado ? "Copiado!" : "Compartilhar"}
        </Button>
      </div>

      <Card className="print:rounded-none print:border-0 print:shadow-none">
        <div className="mb-4 flex items-center justify-between border-b border-line-soft pb-4 print:border-black">
          <Image src="/logo.png" alt="Banca Favorita" width={48} height={48} className="size-12 object-contain" />
          <div className="text-right">
            <p className="text-xs text-muted print:text-black">Bilhete</p>
            <b className="font-mono text-gold print:text-black">{poule.code}</b>
          </div>
        </div>

        <div className="mb-4 space-y-1 text-sm">
          <p>
            <span className="text-muted print:text-black">Sorteio: </span>
            <b>{poule.draw.lottery}</b>
          </p>
          <p>
            <span className="text-muted print:text-black">Data/hora: </span>
            {formatDateBR(poule.draw.date.slice(0, 10))} • {poule.draw.time}
          </p>
          {poule.cambistaClient && (
            <p>
              <span className="text-muted print:text-black">Cliente: </span>
              {poule.cambistaClient.name}
              {poule.cambistaClient.phone ? ` · ${poule.cambistaClient.phone}` : ""}
            </p>
          )}
          {poule.paymentMethod && (
            <p>
              <span className="text-muted print:text-black">Pagamento: </span>
              {PAYMENT_LABEL[poule.paymentMethod] ?? poule.paymentMethod}
            </p>
          )}
        </div>

        <div className="mb-4 space-y-3 border-t border-b border-line-soft py-4 print:border-black">
          {poule.bets.map((b) => (
            <div key={b.id} className="text-sm">
              <b>{b.modality}</b> — {b.numbers.join(", ")} ({b.prizeFrom}º ao {b.prizeTo}º)
              <p className="text-xs text-muted print:text-black">
                {formatBRL(Number(b.total))} · possível ganho:{" "}
                <b className="text-gold print:text-black">
                  {formatBRL(potentialPayout(Number(b.unitValue), b.modality as ModalityId))}
                </b>
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted print:text-black">Total apostado</span>
          <b className="text-xl text-gold print:text-black">{formatBRL(Number(poule.total))}</b>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm text-muted print:text-black">Status</span>
          <b className="print:text-black">{STATUS_LABEL[poule.status]}</b>
        </div>
      </Card>
    </div>
  );
}
