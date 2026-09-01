import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { formatBRL } from "@/lib/format";

export type UltimaAposta = {
  code: string;
  total: string;
  status: "AGUARDANDO" | "BATIDO" | "PERDIDO";
  createdAt: string;
  draw: { lottery: string; time: string };
};

const STATUS_LABEL = { AGUARDANDO: "Pendente", BATIDO: "Ganhou", PERDIDO: "Perdeu" } as const;
const STATUS_TONE = { AGUARDANDO: "pending", BATIDO: "win", PERDIDO: "loss" } as const;

export default function OpenBetCard({ aposta }: { aposta: UltimaAposta }) {
  const hoje = new Date().toDateString() === new Date(aposta.createdAt).toDateString();
  const hora = new Date(aposta.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <Link
      href="/poules"
      className="flex items-center justify-between rounded-lg border border-line bg-panel-2 p-3 text-sm hover:border-[#3c6da8]"
    >
      <div>
        <b>{aposta.draw.lottery}</b>
        <p className="text-xs text-muted">
          {hoje ? `Hoje às ${hora}` : `${hora}`} · {formatBRL(Number(aposta.total))}
        </p>
      </div>
      <Badge tone={STATUS_TONE[aposta.status]}>{STATUS_LABEL[aposta.status]}</Badge>
    </Link>
  );
}
