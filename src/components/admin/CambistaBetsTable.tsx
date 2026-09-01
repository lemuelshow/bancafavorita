"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useAuth } from "@/contexts/AuthContext";
import { request } from "@/lib/api-client";
import { formatBRL, formatDateBR } from "@/lib/format";

type PouleRow = {
  id: string;
  code: string;
  total: string;
  returnAmount: string;
  status: "AGUARDANDO" | "BATIDO" | "PERDIDO";
  createdAt: string;
  user: { name: string; phone: string };
  cambistaClient: { name: string; phone: string; address: string | null } | null;
  draw: { lottery: string; date: string; time: string };
  paymentMethod: string | null;
};

const STATUS_TONE = { AGUARDANDO: "muted", BATIDO: "win", PERDIDO: "loss" } as const;
const PAYMENT_LABEL: Record<string, string> = { PIX: "Pix", DINHEIRO: "Dinheiro", CARTAO: "Cartão", FIADO: "Fiado" };
const PAYMENT_TONE = { PIX: "win", DINHEIRO: "win", CARTAO: "win", FIADO: "loss" } as const;

export default function CambistaBetsTable() {
  const { token } = useAuth();
  const [page, setPage] = useState(1);
  const [onlyWins, setOnlyWins] = useState(false);
  const [poules, setPoules] = useState<PouleRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function carregar(targetPage: number, wins: boolean) {
    if (!token) return;
    const params = new URLSearchParams({ page: String(targetPage) });
    if (wins) params.set("ganhos", "1");
    const data = await request<{ poules: PouleRow[]; total: number; pageSize: number }>(
      `/api/admin/cambistas/apostas?${params.toString()}`,
      { token }
    );
    setPoules(data.poules);
    setTotal(data.total);
    setPageSize(data.pageSize);
    setPage(targetPage);
  }

  useEffect(() => {
    if (!token) return;
    const id = setTimeout(() => carregar(1, false), 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { label: "Todas", value: false },
          { label: "Apenas ganhos", value: true },
        ].map((opt) => (
          <button
            key={opt.label}
            onClick={() => {
              setOnlyWins(opt.value);
              carregar(1, opt.value);
            }}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
              onlyWins === opt.value ? "border-gold bg-gold text-navy" : "border-line bg-panel-2 text-muted hover:border-[#3c6da8]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-line bg-panel-2 text-left text-xs uppercase text-muted">
              <th className="px-4 py-3">Cambista</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Sorteio</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Pagamento</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {poules?.map((p) => (
              <tr
                key={p.id}
                className={`border-b border-line last:border-0 ${p.status === "BATIDO" ? "bg-win/5" : "bg-panel"}`}
              >
                <td className="px-4 py-3">
                  <b>{p.user.name}</b>
                  <p className="text-xs text-muted">{p.user.phone}</p>
                </td>
                <td className="px-4 py-3">
                  {p.cambistaClient ? (
                    <>
                      <b>{p.cambistaClient.name}</b>
                      <p className="text-xs text-muted">
                        {p.cambistaClient.phone}
                        {p.cambistaClient.address ? ` · ${p.cambistaClient.address}` : ""}
                      </p>
                    </>
                  ) : (
                    <span className="text-xs text-muted">Para o próprio cambista</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted">
                  <b className="font-mono text-gold">{p.code}</b>
                  <br />
                  {p.draw.lottery} • {formatDateBR(p.draw.date.slice(0, 10))} • {p.draw.time}
                </td>
                <td className="px-4 py-3">
                  {formatBRL(Number(p.total))}
                  {p.status === "BATIDO" && (
                    <p className="text-xs font-bold text-win">ganhou {formatBRL(Number(p.returnAmount))}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  {p.paymentMethod ? (
                    <Badge tone={PAYMENT_TONE[p.paymentMethod as keyof typeof PAYMENT_TONE] ?? "muted"}>
                      {PAYMENT_LABEL[p.paymentMethod] ?? p.paymentMethod}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {poules !== null && poules.length === 0 && (
        <Card className="mt-4 text-center text-muted">Nenhuma aposta de cambista encontrada.</Card>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => carregar(page - 1, onlyWins)}>
            ← Anterior
          </Button>
          <span className="text-sm text-muted">
            Página {page} de {totalPages}
          </span>
          <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => carregar(page + 1, onlyWins)}>
            Próxima →
          </Button>
        </div>
      )}
    </div>
  );
}
