"use client";

import Modal from "@/components/ui/Modal";
import LevelBadge from "@/components/dashboard/LevelBadge";
import { LEVEL_TIERS, levelForXp } from "@/lib/levels";

export default function BenefitsModal({ xp, open, onClose }: { xp: number; open: boolean; onClose: () => void }) {
  const nivel = levelForXp(xp);

  return (
    <Modal open={open} onClose={onClose} title="Níveis e benefícios">
      <p className="mb-4 text-sm text-muted">Você ganha 1 XP a cada R$1 apostado. Suba de nível apostando na Banca Favorita.</p>
      <div className="space-y-2">
        {LEVEL_TIERS.map((tier) => {
          const atual = tier.id === nivel.tier.id;
          const alcancado = nivel.xp >= tier.minXp;
          return (
            <div
              key={tier.id}
              className={`flex items-center justify-between rounded-lg border p-3 text-sm ${
                atual ? "border-gold bg-gold/5" : "border-line bg-panel-2"
              }`}
            >
              <span className={`flex items-center gap-2 ${alcancado ? "font-bold" : "text-muted"}`}>
                <LevelBadge tier={tier} size={28} /> {tier.label}
              </span>
              <span className="text-xs text-muted">a partir de {tier.minXp} XP</span>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
