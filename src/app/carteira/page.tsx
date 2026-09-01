"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import PixDepositCard from "@/components/carteira/PixDepositCard";
import { formatBRL } from "@/lib/format";
import { request } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";

type Transacao = { id: string; kind: string; amount: string; description: string; createdAt: string };

const KIND_LABEL: Record<string, string> = {
  DEPOSITO_PIX: "Depósito Pix",
  DEPOSITO_SIMULADO: "Depósito",
  SAQUE_SIMULADO: "Saque",
  APOSTA: "Aposta",
  PREMIO: "Prêmio",
};

export default function CarteiraPage() {
  const { user, token, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [saldo, setSaldo] = useState<number | null>(null);
  const [extrato, setExtrato] = useState<Transacao[]>([]);
  const [valor, setValor] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  async function carregar() {
    if (!token) return;
    const data = await request<{ balance: number; extrato: Transacao[] }>("/api/carteira", { token });
    setSaldo(data.balance);
    setExtrato(data.extrato);
  }

  useEffect(() => {
    if (!token) return;
    const id = setTimeout(carregar, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function mover(kind: "deposito" | "saque") {
    setErro(null);
    const amount = Number(valor.replace(",", "."));
    if (!(amount > 0)) {
      setErro("Informe um valor maior que zero.");
      return;
    }
    setEnviando(true);
    try {
      await request("/api/carteira", { method: "POST", token, body: JSON.stringify({ kind, amount }) });
      setValor("");
      await carregar();
      await refreshUser();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível concluir.");
    } finally {
      setEnviando(false);
    }
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-black">Carteira</h1>

      <Card className="mb-6 text-center">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">Saldo</p>
        <p className="mt-1 text-3xl font-black text-gold">{saldo === null ? "..." : formatBRL(saldo)}</p>
        <p className="mt-2 text-xs text-muted">Depósitos via Pix são processados de verdade. Saques permanecem simulados.</p>
      </Card>

      <PixDepositCard
        onConfirmado={async () => {
          await carregar();
          await refreshUser();
        }}
      />

      <Card className="mb-6">
        <label className="mb-3 block">
          <span className="mb-1.5 block text-[13px] font-bold text-[#c9d8ed]">Sacar (simulado) — valor (R$)</span>
          <input
            inputMode="decimal"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0,00"
            className="w-full rounded-lg border border-[#2d619f] bg-panel-2 p-3"
          />
        </label>
        {erro && <p className="mb-3 text-sm text-danger">{erro}</p>}
        <Button variant="secondary" className="w-full" disabled={enviando} onClick={() => mover("saque")}>
          Sacar (simulado)
        </Button>
      </Card>

      <h2 className="mb-3 text-lg font-black">Movimentações</h2>
      {extrato.length === 0 ? (
        <p className="text-sm text-muted">Nenhuma movimentação ainda.</p>
      ) : (
        <div className="space-y-2">
          {extrato.map((t) => {
            const amount = Number(t.amount);
            const isPix = t.kind.startsWith("DEPOSITO") || t.kind === "SAQUE_SIMULADO";
            const isSaque = t.kind === "SAQUE_SIMULADO";
            return (
              <div key={t.id} className="flex items-center gap-3 rounded-lg border border-line bg-panel-2 p-3 text-sm">
                {isPix && (
                  <Image
                    src={isSaque ? "/pix-vermelho.png" : "/pix-verde.png"}
                    alt={isSaque ? "Saque" : "Depósito"}
                    width={32}
                    height={32}
                    className="size-8 shrink-0 object-contain"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <b>{KIND_LABEL[t.kind] ?? t.kind}</b>
                  <p className="text-muted">{t.description}</p>
                </div>
                <b className={`shrink-0 ${amount >= 0 ? "text-win" : "text-loss"}`}>
                  {amount >= 0 ? "+" : ""}
                  {formatBRL(amount)}
                </b>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
