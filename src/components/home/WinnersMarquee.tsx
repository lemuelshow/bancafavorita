import Image from "next/image";
import { formatBRL } from "@/lib/format";

type Winner = { nome: string; cidade: string; premio: string; valor: number; tempo: string };

// Dados de exemplo (mockados) — sem vínculo com apostas reais.
const WINNERS: Winner[] = [
  { nome: "J. Silva", cidade: "Recife/PE", premio: "Grupo 12 — Pavão", valor: 480, tempo: "há 3 min" },
  { nome: "M. Santos", cidade: "João Pessoa/PB", premio: "Milhar 7734", valor: 3200, tempo: "há 9 min" },
  { nome: "A. Costa", cidade: "Olinda/PE", premio: "Grupo 04 — Borboleta", valor: 720, tempo: "há 14 min" },
  { nome: "R. Oliveira", cidade: "Campina Grande/PB", premio: "Centena 217", valor: 1150, tempo: "há 22 min" },
  { nome: "L. Souza", cidade: "Cabedelo/PB", premio: "Grupo 25 — Vaca", valor: 340, tempo: "há 31 min" },
  { nome: "P. Ferreira", cidade: "Recife/PE", premio: "Dezena 58", valor: 210, tempo: "há 40 min" },
  { nome: "C. Almeida", cidade: "Jaboatão/PE", premio: "Grupo 18 — Galo", valor: 960, tempo: "há 52 min" },
  { nome: "T. Lima", cidade: "Santa Rita/PB", premio: "Milhar 4409", valor: 4800, tempo: "há 1 h" },
];

function WinnerCard({ w }: { w: Winner }) {
  return (
    <div className="flex w-[230px] shrink-0 items-center gap-3 rounded-xl border border-line bg-panel p-3">
      <Image src="/trofeu.png" alt="Ganhador" width={36} height={36} className="size-9 shrink-0 object-contain" />
      <div className="min-w-0">
        <p className="truncate text-sm font-black">
          {w.nome} <span className="font-normal text-muted">· {w.cidade}</span>
        </p>
        <p className="truncate text-xs text-muted">{w.premio}</p>
        <p className="text-sm font-black text-win">
          {formatBRL(w.valor)} <span className="text-[11px] font-normal text-muted">{w.tempo}</span>
        </p>
      </div>
    </div>
  );
}

export default function WinnersMarquee() {
  const items = [...WINNERS, ...WINNERS];

  return (
    <div className="relative mx-auto mt-3 max-w-[1200px] overflow-hidden rounded-2xl border border-line bg-panel-2 py-4">
      <div className="animate-marquee flex w-max gap-3 px-4 [animation-play-state:running] hover:[animation-play-state:paused]">
        {items.map((w, i) => (
          <WinnerCard key={i} w={w} />
        ))}
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-panel-2 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-panel-2 to-transparent" />
    </div>
  );
}
