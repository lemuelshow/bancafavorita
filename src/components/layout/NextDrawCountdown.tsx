"use client";

import { useEffect, useState } from "react";
import { nextOpenDraw } from "@/lib/lotteries";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export default function NextDrawCountdown({ compact = false }: { compact?: boolean }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- primeira leitura do relógio, só existe no cliente (evita mismatch de hidratação).
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;
  const draw = nextOpenDraw(now);
  if (!draw) return null;

  const diff = Math.max(0, draw.drawAt.getTime() - now.getTime());
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);

  return (
    <div
      className={`flex items-center gap-2 whitespace-nowrap rounded-full border border-line bg-panel-2 ${
        compact ? "px-3 py-1 text-[11px]" : "px-4 py-2 text-sm"
      }`}
    >
      <span className="text-gold">⏱</span>
      <span className="text-muted">Próximo sorteio</span>
      <b>
        {draw.lottery} {draw.time}
      </b>
      <b className="font-mono text-gold tabular-nums">
        {h > 0 ? `${pad(h)}:` : ""}
        {pad(m)}:{pad(s)}
      </b>
    </div>
  );
}
