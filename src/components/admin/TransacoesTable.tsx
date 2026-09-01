"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { request } from "@/lib/api-client";
import { formatBRL } from "@/lib/format";

type TransacaoRow = {
  id: string;
  kind: string;
  amount: string;
  description: string;
  createdAt: string;
  user: { name: string; email: string | null; phone: string };
};

const KIND_LABEL: Record<string, string> = {
  DEPOSITO_PIX: "Depósito Pix",
  DEPOSITO_SIMULADO: "Depósito simulado",
  SAQUE_SIMULADO: "Saque",
  APOSTA: "Aposta",
  PREMIO: "Prêmio",
};

const KIND_OPTIONS = ["", ...Object.keys(KIND_LABEL)];

export default function TransacoesTable() {
  const { token } = useAuth();
  const [page, setPage] = useState(1);
  const [kind, setKind] = useState("");
  const [transacoes, setTransacoes] = useState<TransacaoRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function carregar(targetPage: number, targetKind: string) {
    if (!token) return;
    const params = new URLSearchParams({ page: String(targetPage) });
    if (targetKind) params.set("kind", targetKind);
    const data = await request<{ transacoes: TransacaoRow[]; total: number; pageSize: number }>(
      `/api/admin/financeiro/transacoes?${params.toString()}`,
      { token }
    );
    setTransacoes(data.transacoes);
    setTotal(data.total);
    setPageSize(data.pageSize);
    setPage(targetPage);
  }

  useEffect(() => {
    if (!token) return;
    const id = setTimeout(() => carregar(1, ""), 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {KIND_OPTIONS.map((k) => (
          <button
            key={k || "all"}
            onClick={() => {
              setKind(k);
              carregar(1, k);
            }}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
              kind === k ? "border-gold bg-gold text-navy" : "border-line bg-panel-2 text-muted hover:border-[#3c6da8]"
            }`}
          >
            {k ? KIND_LABEL[k] : "Todas"}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line bg-panel-2 text-left text-xs uppercase text-muted">
              <th className="px-4 py-3">Usuário</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Valor</th>
            </tr>
          </thead>
          <tbody>
            {transacoes?.map((t) => {
              const amount = Number(t.amount);
              return (
                <tr key={t.id} className="border-b border-line bg-panel last:border-0">
                  <td className="px-4 py-3">
                    <b>{t.user.name}</b>
                    <p className="text-xs text-muted">{t.user.email ?? t.user.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{KIND_LABEL[t.kind] ?? t.kind}</td>
                  <td className="px-4 py-3 text-xs text-muted">{t.description}</td>
                  <td className="px-4 py-3 text-xs text-muted">{new Date(t.createdAt).toLocaleString("pt-BR")}</td>
                  <td className={`px-4 py-3 font-bold ${amount >= 0 ? "text-win" : "text-loss"}`}>
                    {amount >= 0 ? "+" : ""}
                    {formatBRL(amount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {transacoes !== null && transacoes.length === 0 && (
        <Card className="mt-4 text-center text-muted">Nenhuma movimentação encontrada.</Card>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => carregar(page - 1, kind)}>
            ← Anterior
          </Button>
          <span className="text-sm text-muted">
            Página {page} de {totalPages}
          </span>
          <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => carregar(page + 1, kind)}>
            Próxima →
          </Button>
        </div>
      )}
    </div>
  );
}
