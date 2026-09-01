"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { LOTTERIES, validTimes, toDateStr, type Lottery } from "@/lib/lotteries";
import { formatDateBR } from "@/lib/format";
import { request } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";

type ResultadoApi = {
  id: string;
  prizes: string[];
  draw: { lottery: string; date: string; time: string };
};

export default function AdminResultadosPage() {
  const { token } = useAuth();
  const [lottery, setLottery] = useState<Lottery>("LOTEP PB");
  const [date, setDate] = useState(toDateStr(new Date()));
  const [timeOverride, setTimeOverride] = useState<string | null>(null);
  const [prizes, setPrizes] = useState(["", "", "", "", ""]);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [results, setResults] = useState<ResultadoApi[]>([]);

  const times = useMemo(() => validTimes(lottery, date), [lottery, date]);
  const time = timeOverride && times.includes(timeOverride) ? timeOverride : (times[0] ?? "");

  async function carregar() {
    if (!token) return;
    const data = await request<{ results: ResultadoApi[] }>("/api/admin/resultados", { token });
    setResults(data.results);
  }

  useEffect(() => {
    if (!token) return;
    const id = setTimeout(carregar, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSucesso(null);

    if (prizes.some((p) => !/^\d{4}$/.test(p))) {
      setErro("Informe os 5 prêmios, cada um com 4 dígitos.");
      return;
    }
    if (!time) {
      setErro("Não há horário válido para esta loteria/data.");
      return;
    }

    setEnviando(true);
    try {
      const { settledCount } = await request<{ settledCount: number }>("/api/admin/resultados", {
        method: "POST",
        token,
        body: JSON.stringify({ lottery, date, time, prizes }),
      });
      setSucesso(`Resultado cadastrado. ${settledCount} pôule(s) conferido(s).`);
      setPrizes(["", "", "", "", ""]);
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setEnviando(false);
    }
  }

  async function buscarAutomatico() {
    setErro(null);
    setSucesso(null);
    if (!time) {
      setErro("Não há horário válido para esta loteria/data.");
      return;
    }
    setBuscando(true);
    try {
      const { settledCount } = await request<{ prizes: string[]; settledCount: number }>(
        "/api/admin/resultados/buscar",
        { method: "POST", token, body: JSON.stringify({ lottery, date, time }) }
      );
      setSucesso(`Resultado encontrado e cadastrado automaticamente. ${settledCount} pôule(s) conferido(s).`);
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível buscar o resultado.");
    } finally {
      setBuscando(false);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-black">Resultados / Extrações</h1>

      <Card className="mb-8 max-w-xl">
        <h2 className="mb-4 text-lg font-black">Cadastrar resultado</h2>
        <p className="mb-4 text-xs text-muted">
          Busque automaticamente na fonte oficial ou digite os prêmios manualmente abaixo.
        </p>
        <form onSubmit={onSubmit}>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-[#c9d8ed]">Loteria</span>
              <select
                value={lottery}
                onChange={(e) => setLottery(e.target.value as Lottery)}
                className="w-full rounded-lg border border-[#2d619f] bg-panel-2 p-3"
              >
                {LOTTERIES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-[#c9d8ed]">Data</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-[#2d619f] bg-panel-2 p-3"
              />
            </label>
          </div>

          <label className="mb-3 block">
            <span className="mb-1.5 block text-[13px] font-bold text-[#c9d8ed]">Horário</span>
            <select
              value={time}
              onChange={(e) => setTimeOverride(e.target.value)}
              className="w-full rounded-lg border border-[#2d619f] bg-panel-2 p-3"
              disabled={times.length === 0}
            >
              {times.length === 0 && <option value="">Sem sorteio nesta data</option>}
              {times.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <Button
            type="button"
            variant="secondary"
            className="mb-4 w-full"
            disabled={buscando || !time}
            onClick={buscarAutomatico}
          >
            {buscando ? "Buscando..." : "Buscar resultado automaticamente"}
          </Button>

          <div className="mb-4 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line-soft" />
            ou digite manualmente
            <span className="h-px flex-1 bg-line-soft" />
          </div>

          <span className="mb-1.5 block text-[13px] font-bold text-[#c9d8ed]">Prêmios (1º ao 5º)</span>
          <div className="mb-4 grid grid-cols-5 gap-2">
            {prizes.map((p, i) => (
              <input
                key={i}
                inputMode="numeric"
                maxLength={4}
                value={p}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setPrizes((prev) => prev.map((x, idx) => (idx === i ? v : x)));
                }}
                className="w-full rounded-lg border border-[#2d619f] bg-panel-2 p-2 text-center font-mono"
                placeholder="0000"
              />
            ))}
          </div>

          {erro && <p className="mb-3 text-sm text-danger">{erro}</p>}
          {sucesso && <p className="mb-3 text-sm text-win">{sucesso}</p>}

          <Button type="submit" size="lg" className="w-full" disabled={enviando}>
            {enviando ? "Salvando..." : "Salvar resultado"}
          </Button>
        </form>
      </Card>

      <h2 className="mb-3 text-lg font-black">Resultados cadastrados</h2>
      <div className="space-y-2">
        {results.map((r) => (
          <Card key={r.id} className="flex items-center justify-between py-3">
            <div>
              <b>{r.draw.lottery}</b>
              <span className="ml-2 text-sm text-muted">
                {formatDateBR(r.draw.date.slice(0, 10))} • {r.draw.time}
              </span>
            </div>
            <span className="font-mono text-gold">{r.prizes.join(" · ")}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}
