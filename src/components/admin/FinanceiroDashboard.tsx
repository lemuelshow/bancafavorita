"use client";

import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Card from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";
import { request } from "@/lib/api-client";
import { formatBRL } from "@/lib/format";

type Summary = {
  totalDepositado: number;
  totalSacado: number;
  totalApostado: number;
  totalPremiosPagos: number;
  totalComissaoCambista: number;
  totalCpaAfiliado: number;
  totalRevAfiliado: number;
  saldoTotalCarteiras: number;
  lucroBruto: number;
  series: { day: string; depositado: number; apostado: number; premios: number }[];
};

function StatCard({ label, value, tone = "text" }: { label: string; value: string; tone?: "text" | "gold" | "win" | "loss" }) {
  const toneClass = { text: "text-text", gold: "text-gold", win: "text-win", loss: "text-loss" }[tone];
  return (
    <Card>
      <span className="block text-xs text-muted">{label}</span>
      <b className={`mt-1.5 block text-xl font-black ${toneClass}`}>{value}</b>
    </Card>
  );
}

function formatDia(iso: string) {
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default function FinanceiroDashboard() {
  const { token } = useAuth();
  const [data, setData] = useState<Summary | null>(null);

  useEffect(() => {
    if (!token) return;
    const id = setTimeout(() => {
      request<Summary>("/api/admin/financeiro/summary", { token }).then(setData);
    }, 0);
    return () => clearTimeout(id);
  }, [token]);

  if (!data) return <p className="text-sm text-muted">Carregando...</p>;

  const chartData = data.series.map((s) => ({ ...s, dia: formatDia(s.day) }));

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total depositado" value={formatBRL(data.totalDepositado)} tone="win" />
        <StatCard label="Total sacado" value={formatBRL(data.totalSacado)} />
        <StatCard label="Total apostado" value={formatBRL(data.totalApostado)} tone="gold" />
        <StatCard label="Prêmios pagos" value={formatBRL(data.totalPremiosPagos)} tone="loss" />
        <StatCard label="Comissão cambista" value={formatBRL(data.totalComissaoCambista)} />
        <StatCard label="CPA afiliado" value={formatBRL(data.totalCpaAfiliado)} />
        <StatCard label="REV afiliado" value={formatBRL(data.totalRevAfiliado)} />
        <StatCard label="Saldo em carteiras" value={formatBRL(data.saldoTotalCarteiras)} />
      </div>

      <Card className="mb-6">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-wide text-muted">Lucro bruto da casa</h2>
        </div>
        <p className={`text-3xl font-black ${data.lucroBruto >= 0 ? "text-win" : "text-loss"}`}>
          {formatBRL(data.lucroBruto)}
        </p>
        <p className="mt-1 text-xs text-muted">
          Apostado − prêmios pagos − comissão de cambistas − CPA e REV de afiliados.
        </p>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-black">Movimentação — últimos 30 dias</h2>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ left: -10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#173d70" />
              <XAxis dataKey="dia" stroke="#8eaad0" fontSize={12} />
              <YAxis stroke="#8eaad0" fontSize={12} tickFormatter={(v) => `R$${v}`} />
              <Tooltip
                contentStyle={{ background: "#0a2348", border: "1px solid #224d86", borderRadius: 8 }}
                labelStyle={{ color: "#f7faff" }}
                formatter={(value) => formatBRL(Number(value))}
              />
              <Line type="monotone" dataKey="depositado" name="Depositado" stroke="#55e889" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="apostado" name="Apostado" stroke="#ffd629" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="premios" name="Prêmios pagos" stroke="#ff667a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
