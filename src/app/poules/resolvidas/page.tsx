"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useAuth } from "@/contexts/AuthContext";
import { request } from "@/lib/api-client";
import { formatBRL, formatDateBR } from "@/lib/format";

type PouleApi = {
  id: string;
  code: string;
  total: string;
  returnAmount: string;
  status: "AGUARDANDO" | "BATIDO" | "PERDIDO";
  draw: { lottery: string; date: string; time: string };
};

export default function ResolvedPoulesPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [poules, setPoules] = useState<PouleApi[] | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!token) return;
    const id = setTimeout(() => {
      request<{ poules: PouleApi[] }>("/api/poules", { token }).then((data) => setPoules(data.poules));
    }, 0);
    return () => clearTimeout(id);
  }, [token]);

  if (!user) return null;

  const resolvidos = poules?.filter((p) => p.status !== "AGUARDANDO") ?? null;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-black">Apostas Resolvidas</h1>

      {resolvidos === null && <p className="text-sm text-muted">Carregando...</p>}
      {resolvidos !== null && resolvidos.length === 0 && (
        <Card className="text-center text-muted">Nenhuma aposta resolvida ainda.</Card>
      )}

      <div className="space-y-3">
        {resolvidos?.map((p) => (
          <Card key={p.id} className={p.status === "BATIDO" ? "border-win/40" : "border-loss/30"}>
            <div className="flex items-center justify-between">
              <div>
                <b className="font-mono text-gold">{p.code}</b>
                <p className="mt-1 text-sm text-muted">
                  {p.draw.lottery} • {formatDateBR(p.draw.date.slice(0, 10))} • {p.draw.time}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-lg font-black ${p.status === "BATIDO" ? "text-win" : "text-loss"}`}>
                  {p.status === "BATIDO" ? formatBRL(Number(p.returnAmount)) : formatBRL(Number(p.total))}
                </p>
                <Badge tone={p.status === "BATIDO" ? "win" : "loss"}>
                  {p.status === "BATIDO" ? "PREMIADO" : "NÃO PREMIADO"}
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
