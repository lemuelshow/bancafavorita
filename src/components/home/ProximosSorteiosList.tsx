"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { formatBRL, formatDateBR } from "@/lib/format";

export type ProximoSorteio = { lottery: string; date: string; time: string; drawAt: string; acumulado: number };

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function Countdown({ drawAt }: { drawAt: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- primeira leitura do relógio, só existe no cliente (evita mismatch de hidratação).
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (now === null) return null;
  const diff = Math.max(0, new Date(drawAt).getTime() - now);
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);

  return (
    <span className="font-mono text-xl font-black text-gold tabular-nums">
      {pad(h)}:{pad(m)}:{pad(s)}
    </span>
  );
}

function quandoLabel(dateStr: string, time: string): string {
  const hoje = new Date().toISOString().slice(0, 10);
  if (dateStr === hoje) return `Hoje às ${time}`;
  return `${formatDateBR(dateStr)} às ${time}`;
}

export default function ProximosSorteiosList({ items }: { items: ProximoSorteio[] | null }) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[11px] font-black tracking-[0.12em] text-gold uppercase">Próximos sorteios</span>
        <Link href="/register" className="text-xs font-bold text-gold hover:underline">
          Ver todos
        </Link>
      </div>

      {items === null && <p className="text-sm text-muted">Carregando...</p>}
      {items !== null && items.length === 0 && <p className="text-sm text-muted">Nenhum sorteio aberto no momento.</p>}

      <div className="space-y-2">
        {items?.map((d) => (
          <div key={`${d.lottery}|${d.date}|${d.time}`} className="rounded-xl border border-line bg-panel-2 p-3">
            {/* Mobile: nome + contagem numa linha, acumulado + apostar na linha de baixo */}
            <div className="flex items-center gap-3 sm:hidden">
              <Image src="/trevo.png" alt="" width={32} height={32} className="size-8 shrink-0 object-contain" />
              <div className="min-w-0 flex-1">
                <b className="block truncate text-sm">{d.lottery}</b>
                <span className="text-xs text-muted">{quandoLabel(d.date, d.time)}</span>
              </div>
              <Countdown drawAt={d.drawAt} />
            </div>
            <div className="mt-2.5 flex items-center justify-between gap-2 sm:hidden">
              <p className="text-xs text-muted">
                Acumulado <b className="text-win">{formatBRL(d.acumulado)}</b>
              </p>
              <Link href="/register">
                <Button size="sm">Apostar</Button>
              </Link>
            </div>

            {/* Desktop: tudo numa linha só */}
            <div className="hidden items-center gap-3 sm:flex">
              <Image src="/trevo.png" alt="" width={36} height={36} className="size-9 shrink-0 object-contain" />
              <div className="min-w-0 flex-1">
                <b className="block truncate text-sm">{d.lottery}</b>
                <span className="text-xs text-muted">{quandoLabel(d.date, d.time)}</span>
              </div>
              <div className="flex-1 text-center">
                <Countdown drawAt={d.drawAt} />
              </div>
              <div className="text-right">
                <p className="text-[11px] text-muted">Acumulado</p>
                <b className="text-win">{formatBRL(d.acumulado)}</b>
              </div>
              <Link href="/register">
                <Button size="sm">Apostar</Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
