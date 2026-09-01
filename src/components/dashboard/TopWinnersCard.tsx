import Link from "next/link";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/dashboard/Skeleton";
import { formatBRL } from "@/lib/format";
import type { WinnerRanking } from "@/lib/ranking";

type Props = { winners: WinnerRanking[] } | { loading: true } | { error: true };

const MEDALHA = ["🥇", "🥈", "🥉"];

export default function TopWinnersCard(props: Props) {
  if ("loading" in props) {
    return (
      <Card>
        <Skeleton className="mb-3 h-4 w-28" />
        <div className="space-y-2.5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if ("error" in props) {
    return <Card className="text-center text-sm text-danger">Não foi possível carregar o ranking.</Card>;
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-wide">Top ganhadores</h3>
        <Link href="/ranking" className="text-xs font-bold text-gold hover:underline">
          Ver ranking
        </Link>
      </div>

      {props.winners.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line p-3 text-center text-xs text-muted">
          Ainda não há ganhadores registrados.
        </p>
      ) : (
        <div className="space-y-2">
          {props.winners.map((w, i) => (
            <div key={w.userId} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 truncate">
                <span className="w-4 shrink-0 text-center">{MEDALHA[i] ?? i + 1}</span>
                <span className="truncate text-xs">{w.name}</span>
              </span>
              <b className="shrink-0 text-win">{formatBRL(w.total)}</b>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
