"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { request } from "@/lib/api-client";
import { formatBRL } from "@/lib/format";
import { formatCpf } from "@/lib/cpf";
import { LEVEL_TIERS, levelForXp } from "@/lib/levels";
import LevelBadge from "@/components/dashboard/LevelBadge";

export default function PerfilPage() {
  const { user, token, loading, logout } = useAuth();
  const router = useRouter();
  const [xp, setXp] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!token) return;
    const id = setTimeout(() => {
      request<{ xp: number }>("/api/dashboard/resumo", { token }).then((d) => setXp(d.xp));
    }, 0);
    return () => clearTimeout(id);
  }, [token]);

  if (!user) return null;
  const nivel = levelForXp(xp ?? 0);

  const rows: [string, string][] = [
    ["Nome", user.name],
    ["CPF", formatCpf(user.cpf)],
    ["Celular", user.phone],
    ["E-mail", user.email ?? "—"],
    ["Saldo", formatBRL(user.balance)],
  ];

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-2xl font-black">Perfil</h1>
      <Card className="mb-6">
        <div className="divide-y divide-line-soft">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-3 text-sm">
              <span className="text-muted">{label}</span>
              <b>{value}</b>
            </div>
          ))}
        </div>
        <Button
          variant="secondary"
          size="lg"
          className="mt-6 w-full"
          onClick={() => {
            logout();
            router.push("/login");
          }}
        >
          Sair
        </Button>
      </Card>

      <Card>
        <h2 className="mb-1 font-black">Nível e benefícios</h2>
        <p className="mb-4 text-sm text-muted">
          Você ganha 1 XP a cada R$1 apostado. Suba de nível apostando na Banca Favorita.
        </p>
        <div className="mb-4 flex items-center justify-between rounded-lg border border-gold/30 bg-gold/10 p-3">
          <span className="flex items-center gap-2 font-black">
            <LevelBadge tier={nivel.tier} size={28} /> Nível {nivel.tier.label}
          </span>
          <span className="text-sm text-muted">{nivel.xp} XP</span>
        </div>
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
      </Card>
    </div>
  );
}
