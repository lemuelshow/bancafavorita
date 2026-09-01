export type LevelTier = { id: string; label: string; minXp: number; icon: string; badge?: string };

// 1 XP = R$1 apostado. Limiares definem quanto o jogador precisa ter apostado (acumulado) para subir de nível.
// badge = selo ilustrado (public/); sem selo próprio (ex.: Diamante), cai no emoji de `icon`.
export const LEVEL_TIERS: LevelTier[] = [
  { id: "bronze", label: "Bronze", minXp: 0, icon: "🥉", badge: "/bronze.png" },
  { id: "prata", label: "Prata", minXp: 1000, icon: "🥈", badge: "/prata.png" },
  { id: "ouro", label: "Ouro", minXp: 5000, icon: "🥇", badge: "/ouro.png" },
  { id: "diamante", label: "Diamante", minXp: 20000, icon: "💎" },
];

export type LevelInfo = {
  tier: LevelTier;
  next: LevelTier | null;
  xp: number;
  xpIntoTier: number;
  xpForNext: number | null;
  progressPct: number;
};

export function levelForXp(xp: number): LevelInfo {
  let tier = LEVEL_TIERS[0];
  let next: LevelTier | null = null;
  for (let i = 0; i < LEVEL_TIERS.length; i++) {
    if (xp >= LEVEL_TIERS[i].minXp) {
      tier = LEVEL_TIERS[i];
      next = LEVEL_TIERS[i + 1] ?? null;
    }
  }
  const xpIntoTier = xp - tier.minXp;
  const xpForNext = next ? next.minXp - tier.minXp : null;
  const progressPct = xpForNext ? Math.min(100, Math.round((xpIntoTier / xpForNext) * 100)) : 100;
  return { tier, next, xp, xpIntoTier, xpForNext, progressPct };
}
