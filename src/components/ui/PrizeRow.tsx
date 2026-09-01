import type { Bicho } from "@/lib/animals";

export default function PrizeRow({ posicaoLabel, numero, animal }: { posicaoLabel: string; numero: string; animal: Bicho }) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-line-soft py-2.5 last:border-0">
      <span className="text-sm text-muted">{posicaoLabel}</span>
      <span className="flex shrink-0 gap-1" aria-label={`Número sorteado ${numero}`}>
        {numero.split("").map((digito, i) => (
          <span
            key={i}
            className="flex size-8 items-center justify-center rounded-full bg-gold font-mono text-sm font-black leading-none text-navy shadow-[inset_0_-2px_4px_rgba(0,0,0,0.28),inset_0_2px_2px_rgba(255,255,255,0.55)]"
          >
            {digito}
          </span>
        ))}
      </span>
      <span className="text-right text-sm">
        {animal.emoji} {animal.nome}
      </span>
    </div>
  );
}
