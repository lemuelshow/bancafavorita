"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import ResumoAdmin from "@/components/dashboard/ResumoAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { request } from "@/lib/api-client";
import { formatBRL, formatDateBR } from "@/lib/format";

type DashboardApi = {
  clientCount: number;
  totalBalance: number;
  draws: {
    id: string;
    lottery: string;
    date: string;
    time: string;
    result: { prizes: string[] } | null;
    poules: { total: string; returnAmount: string }[];
  }[];
};

export default function AdminDashboard() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardApi | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (!user.isAdmin) router.replace("/");
  }, [loading, user, router]);

  useEffect(() => {
    if (!token || !user?.isAdmin) return;
    const id = setTimeout(() => {
      request<DashboardApi>("/api/admin/dashboard", { token }).then(setData);
    }, 0);
    return () => clearTimeout(id);
  }, [token, user]);

  if (!user?.isAdmin) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0">
        <h1 className="mb-6 text-2xl font-black">Painel</h1>

        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card>
            <span className="block text-xs text-muted">Clientes</span>
            <b className="mt-1.5 block text-2xl text-gold">{data?.clientCount ?? "..."}</b>
          </Card>
          <Card>
            <span className="block text-xs text-muted">Saldo total em carteiras</span>
            <b className="mt-1.5 block text-2xl text-gold">
              {data ? formatBRL(data.totalBalance) : "..."}
            </b>
          </Card>
        </div>

        <h2 className="mb-3 text-lg font-black">Últimas extrações</h2>
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line bg-panel-2 text-left text-xs uppercase text-muted">
                <th className="px-4 py-3">Sorteio</th>
                <th className="px-4 py-3">Pôules</th>
                <th className="px-4 py-3">Apostado</th>
                <th className="px-4 py-3">Retorno</th>
                <th className="px-4 py-3">Líquido</th>
                <th className="px-4 py-3">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {data?.draws.map((d) => {
                const apostado = d.poules.reduce((s, p) => s + Number(p.total), 0);
                const retorno = d.poules.reduce((s, p) => s + Number(p.returnAmount), 0);
                return (
                  <tr key={d.id} className="border-b border-line bg-panel last:border-0">
                    <td className="px-4 py-3">
                      {d.lottery}
                      <br />
                      <span className="text-xs text-muted">
                        {formatDateBR(d.date.slice(0, 10))} {d.time}
                      </span>
                    </td>
                    <td className="px-4 py-3">{d.poules.length}</td>
                    <td className="px-4 py-3">{formatBRL(apostado)}</td>
                    <td className="px-4 py-3">{formatBRL(retorno)}</td>
                    <td className="px-4 py-3 font-bold">{formatBRL(apostado - retorno)}</td>
                    <td className="px-4 py-3">{d.result ? d.result.prizes.join(" · ") : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="lg:sticky lg:top-[84px] lg:self-start">
        <ResumoAdmin />
      </div>
    </div>
  );
}
