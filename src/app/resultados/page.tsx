"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import PrizeRow from "@/components/ui/PrizeRow";
import { bichoFromPrize } from "@/lib/animals";
import { formatDateBR } from "@/lib/format";
import { LOTTERIES, validTimes, toDateStr, type Lottery } from "@/lib/lotteries";

type ResultadoApi = {
  id: string;
  prizes: string[];
  draw: { lottery: string; date: string; time: string };
};

type Filtro = { lottery: Lottery | ""; date: string; time: string };

const MEDALHA = ["1º prêmio", "2º prêmio", "3º prêmio", "4º prêmio", "5º prêmio"];

function filtroInicial(): Filtro {
  return { lottery: "", date: toDateStr(new Date()), time: "" };
}

export default function ResultadosPage() {
  const [filtro, setFiltro] = useState<Filtro>(filtroInicial);
  const [page, setPage] = useState(1);
  const [resultados, setResultados] = useState<ResultadoApi[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(8);
  const [carregando, setCarregando] = useState(false);

  const timesForFilter = useMemo(
    () => (filtro.lottery && filtro.date ? validTimes(filtro.lottery, filtro.date) : []),
    [filtro.lottery, filtro.date]
  );
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function buscar(f: Filtro, targetPage: number) {
    setCarregando(true);
    const params = new URLSearchParams();
    if (f.lottery) params.set("lottery", f.lottery);
    if (f.date) params.set("date", f.date);
    if (f.time) params.set("time", f.time);
    params.set("page", String(targetPage));

    try {
      const res = await fetch(`/api/resultados?${params.toString()}`);
      const data = await res.json();
      setResultados(data.results ?? []);
      setTotal(data.total ?? 0);
      setPageSize(data.pageSize ?? 8);
      setPage(targetPage);
    } catch {
      setResultados([]);
      setTotal(0);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => buscar(filtroInicial(), 1), 0);
    return () => clearTimeout(id);
  }, []);

  function limparFiltros() {
    const f = filtroInicial();
    setFiltro(f);
    buscar(f, 1);
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-black">Resultados</h1>
      <p className="mb-6 text-sm text-muted">Filtre por loteria, data e horário para encontrar um sorteio específico.</p>

      <Card className="mb-8">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-[#c9d8ed]">Loteria</span>
            <select
              value={filtro.lottery}
              onChange={(e) => setFiltro((f) => ({ ...f, lottery: e.target.value as Lottery | "", time: "" }))}
              className="w-full rounded-lg border border-[#2d619f] bg-panel-2 p-3"
            >
              <option value="">Todas</option>
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
              value={filtro.date}
              onChange={(e) => setFiltro((f) => ({ ...f, date: e.target.value, time: "" }))}
              className="w-full rounded-lg border border-[#2d619f] bg-panel-2 p-3"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-[#c9d8ed]">Horário</span>
            <select
              value={filtro.time}
              onChange={(e) => setFiltro((f) => ({ ...f, time: e.target.value }))}
              className="w-full rounded-lg border border-[#2d619f] bg-panel-2 p-3"
              disabled={timesForFilter.length === 0}
            >
              <option value="">Todos</option>
              {timesForFilter.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex gap-3">
          <Button onClick={() => buscar(filtro, 1)} disabled={carregando}>
            {carregando ? "Buscando..." : "Filtrar"}
          </Button>
          <Button variant="secondary" onClick={limparFiltros} disabled={carregando}>
            Limpar
          </Button>
        </div>
      </Card>

      {resultados === null && <p className="text-sm text-muted">Carregando...</p>}
      {resultados !== null && resultados.length === 0 && (
        <Card className="text-center text-muted">Nenhum resultado encontrado para esse filtro.</Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {resultados?.map((r) => (
          <Card key={r.id}>
            <h3 className="mb-1 font-black">{r.draw.lottery}</h3>
            <p className="mb-3 text-xs text-muted">
              {formatDateBR(r.draw.date.slice(0, 10))} • {r.draw.time}
            </p>
            <div>
              {r.prizes.map((p, i) => (
                <PrizeRow key={i} posicaoLabel={MEDALHA[i]} numero={p} animal={bichoFromPrize(p)} />
              ))}
            </div>
          </Card>
        ))}
      </div>

      {resultados !== null && resultados.length > 0 && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button variant="secondary" size="sm" disabled={carregando || page <= 1} onClick={() => buscar(filtro, page - 1)}>
            ← Anterior
          </Button>
          <span className="text-sm text-muted">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={carregando || page >= totalPages}
            onClick={() => buscar(filtro, page + 1)}
          >
            Próxima →
          </Button>
        </div>
      )}
    </div>
  );
}
