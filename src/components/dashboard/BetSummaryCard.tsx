import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/dashboard/Skeleton";
import OpenBetCard, { type UltimaAposta } from "@/components/dashboard/OpenBetCard";

type ResumoApostas = { abertas: number; ganhouHoje: number; perdeuHoje: number };

type Props =
  | { resumo: ResumoApostas; ultimaAposta: UltimaAposta | null }
  | { loading: true }
  | { error: true };

export default function BetSummaryCard(props: Props) {
  if ("loading" in props) {
    return (
      <Card>
        <Skeleton className="mb-3 h-4 w-32" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      </Card>
    );
  }

  if ("error" in props) {
    return <Card className="text-center text-sm text-danger">Não foi possível carregar suas apostas.</Card>;
  }

  const { resumo, ultimaAposta } = props;

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-wide">Minhas apostas</h3>
        <Link href="/poules" className="text-xs font-bold text-gold hover:underline">
          Ver todas
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-panel-2 p-2.5">
          <b className="block text-xl text-gold">{resumo.abertas}</b>
          <span className="text-[11px] text-muted">Apostas abertas</span>
        </div>
        <div className="rounded-lg bg-panel-2 p-2.5">
          <b className="block text-xl text-win">{resumo.ganhouHoje}</b>
          <span className="text-[11px] text-muted">Ganharam hoje</span>
        </div>
        <div className="rounded-lg bg-panel-2 p-2.5">
          <b className="block text-xl text-loss">{resumo.perdeuHoje}</b>
          <span className="text-[11px] text-muted">Perderam hoje</span>
        </div>
      </div>

      <div className="mt-3">
        {ultimaAposta ? (
          <OpenBetCard aposta={ultimaAposta} />
        ) : (
          <p className="rounded-lg border border-dashed border-line p-3 text-center text-xs text-muted">
            Nenhuma aposta ainda.
          </p>
        )}
      </div>

      <a href="#montar-poule">
        <Button className="mt-4 w-full">Fazer nova aposta</Button>
      </a>
    </Card>
  );
}
