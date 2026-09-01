import type { ReactNode } from "react";

type Tone = "win" | "loss" | "pending" | "muted";

const toneClasses: Record<Tone, string> = {
  win: "bg-win/15 text-win",
  loss: "bg-loss/15 text-loss",
  pending: "bg-gold/15 text-gold",
  muted: "bg-white/5 text-muted",
};

export default function Badge({ tone = "muted", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-black uppercase tracking-wide ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}
