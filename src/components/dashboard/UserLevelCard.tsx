"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/dashboard/Skeleton";
import BenefitsModal from "@/components/dashboard/BenefitsModal";
import LevelBadge from "@/components/dashboard/LevelBadge";
import { iniciais } from "@/lib/format";
import { levelForXp } from "@/lib/levels";

type Props = { name: string; xp: number } | { loading: true } | { error: true };

export default function UserLevelCard(props: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  if ("loading" in props) {
    return (
      <Card>
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Skeleton className="mt-4 h-2 w-full" />
      </Card>
    );
  }

  if ("error" in props) {
    return <Card className="text-center text-sm text-danger">Não foi possível carregar seu perfil.</Card>;
  }

  const nivel = levelForXp(props.xp);

  return (
    <Card>
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold/15 text-sm font-black text-gold">
          {iniciais(props.name)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-black">Olá, {props.name.split(" ")[0]}!</p>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <LevelBadge tier={nivel.tier} size={22} /> Nível {nivel.tier.label}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-panel-2">
          <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${nivel.progressPct}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-muted">
          {nivel.next ? `${nivel.xpIntoTier} / ${nivel.xpForNext} XP para ${nivel.next.label}` : `${nivel.xp} XP · nível máximo`}
        </p>
      </div>

      <button onClick={() => setModalOpen(true)} className="mt-3 block w-full text-center text-xs font-bold text-gold hover:underline">
        Ver benefícios
      </button>

      <BenefitsModal xp={props.xp} open={modalOpen} onClose={() => setModalOpen(false)} />
    </Card>
  );
}
