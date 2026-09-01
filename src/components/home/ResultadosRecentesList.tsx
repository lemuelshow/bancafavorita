import Link from "next/link";
import Image from "next/image";
import Card from "@/components/ui/Card";
import { formatBRL, formatDateBR } from "@/lib/format";

export type ResultadoRecente = {
  id: string;
  prizes: string[];
  draw: { lottery: string; date: string; time: string };
  totalPago: number;
};

function Digitos({ milhar, size }: { milhar: string; size: "sm" | "lg" }) {
  const box = size === "sm" ? "size-7 text-sm" : "size-10 text-lg";
  return (
    <div className="flex gap-1.5">
      {milhar.split("").map((d, i) => (
        <span
          key={i}
          className={`flex items-center justify-center rounded-full border border-win/40 font-black text-win ${box}`}
        >
          {d}
        </span>
      ))}
    </div>
  );
}

function Trofeu({ ganhou, size }: { ganhou: boolean; size: number }) {
  return (
    <Image
      src="/trofeu.png"
      alt={ganhou ? "Teve ganhador" : "Sem ganhador"}
      title={ganhou ? "Teve ganhador" : "Sem ganhador"}
      width={size}
      height={size}
      className={`shrink-0 object-contain ${ganhou ? "" : "opacity-20 grayscale"}`}
      style={{ width: size, height: size }}
    />
  );
}

export default function ResultadosRecentesList({ items }: { items: ResultadoRecente[] | null }) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[11px] font-black tracking-[0.12em] text-gold uppercase">Resultados recentes</span>
        <Link href="/resultados" className="text-xs font-bold text-gold hover:underline">
          Ver todos
        </Link>
      </div>

      {items === null && <p className="text-sm text-muted">Carregando...</p>}
      {items !== null && items.length === 0 && <p className="text-sm text-muted">Nenhum resultado cadastrado ainda.</p>}

      <div className="space-y-2">
        {items?.map((r) => {
          const milhar = r.prizes[0] ?? "";
          const ganhou = r.totalPago > 0;
          return (
            <div key={r.id} className="rounded-xl border border-line bg-panel-2 p-3">
              {/* Mobile: nome + troféu numa linha, dígitos + valor na linha de baixo */}
              <div className="flex items-center gap-3 sm:hidden">
                <Image src="/trevo.png" alt="" width={32} height={32} className="size-8 shrink-0 object-contain" />
                <div className="min-w-0 flex-1">
                  <b className="block truncate text-sm">{r.draw.lottery}</b>
                  <span className="text-xs text-muted">
                    {formatDateBR(r.draw.date.slice(0, 10))} {r.draw.time}
                  </span>
                </div>
                <Trofeu ganhou={ganhou} size={22} />
              </div>
              <div className="mt-2.5 flex items-center justify-between gap-2 sm:hidden">
                <Digitos milhar={milhar} size="sm" />
                <b className="shrink-0 text-sm text-win">{formatBRL(r.totalPago)}</b>
              </div>

              {/* Desktop: tudo numa linha só */}
              <div className="hidden items-center gap-3 sm:flex">
                <Image src="/trevo.png" alt="" width={36} height={36} className="size-9 shrink-0 object-contain" />
                <div className="min-w-0 flex-1">
                  <b className="block truncate text-sm">{r.draw.lottery}</b>
                  <span className="text-xs text-muted">
                    {formatDateBR(r.draw.date.slice(0, 10))} {r.draw.time}
                  </span>
                </div>
                <Digitos milhar={milhar} size="lg" />
                <b className="w-24 shrink-0 text-right text-sm text-win">{formatBRL(r.totalPago)}</b>
                <Trofeu ganhou={ganhou} size={28} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
