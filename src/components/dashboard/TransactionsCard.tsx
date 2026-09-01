import Link from "next/link";
import Image from "next/image";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/dashboard/Skeleton";
import { formatBRL } from "@/lib/format";

export type Transacao = { id: string; kind: string; amount: string; description: string; createdAt: string };

type Props = { transacoes: Transacao[] } | { loading: true } | { error: true };

const KIND_LABEL: Record<string, string> = {
  DEPOSITO_PIX: "PIX • Depósito",
  DEPOSITO_SIMULADO: "Depósito",
  SAQUE_SIMULADO: "PIX • Saque",
};

function isSaque(kind: string) {
  return kind === "SAQUE_SIMULADO";
}

export default function TransactionsCard(props: Props) {
  if ("loading" in props) {
    return (
      <Card>
        <Skeleton className="mb-3 h-4 w-36" />
        <div className="space-y-2.5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if ("error" in props) {
    return <Card className="text-center text-sm text-danger">Não foi possível carregar as movimentações.</Card>;
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-wide">Depósitos e Saques</h3>
        <Link href="/carteira" className="text-xs font-bold text-gold hover:underline">
          Ver todos
        </Link>
      </div>

      {props.transacoes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line p-3 text-center text-xs text-muted">
          Nenhuma movimentação ainda.
        </p>
      ) : (
        <div className="space-y-3">
          {props.transacoes.slice(0, 3).map((t) => {
            const saque = isSaque(t.kind);
            const amount = Math.abs(Number(t.amount));
            return (
              <div key={t.id} className="flex items-center gap-2.5 text-sm">
                <Image
                  src={saque ? "/pix-vermelho.png" : "/pix-verde.png"}
                  alt={saque ? "Saque" : "Depósito"}
                  width={32}
                  height={32}
                  className="size-8 shrink-0 object-contain"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{KIND_LABEL[t.kind] ?? t.kind}</p>
                  <p className="text-xs text-muted">
                    {new Date(t.createdAt).toLocaleDateString("pt-BR")} {new Date(t.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <b className={saque ? "text-loss" : "text-win"}>
                    {saque ? "-" : "+"} {formatBRL(amount)}
                  </b>
                  <p className="text-[11px] text-muted">{saque ? "Concluído" : "Aprovado"}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
