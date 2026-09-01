"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { BICHOS } from "@/lib/animals";
import { MODALITIES, modalityConfig, type ModalityId } from "@/lib/modalities";
import { calculateBet, potentialPayout, validateBetInput, type BetCalculated, type ValueMode } from "@/lib/betting";
import { formatBRL, formatDateBR } from "@/lib/format";
import { request } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";

export type DrawOption = { lottery: string; date: string; time: string; drawAt: string; closesAt: string };

const PRIZE_OPTIONS = [1, 2, 3, 4, 5];

function drawKey(d: { lottery: string; date: string; time: string }) {
  return `${d.lottery}|${d.date}|${d.time}`;
}

export default function PouleBuilder({ draws, balance }: { draws: DrawOption[]; balance: number }) {
  const router = useRouter();
  const { user, token, refreshUser } = useAuth();
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [cambistaClientId, setCambistaClientId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [drawSel, setDrawSel] = useState<string | null>(draws[0] ? drawKey(draws[0]) : null);
  const [modality, setModality] = useState<ModalityId>("Grupo");
  const [numbers, setNumbers] = useState<string[]>([]);
  const [numberInput, setNumberInput] = useState("");
  const [prizeFrom, setPrizeFrom] = useState(1);
  const [prizeTo, setPrizeTo] = useState(5);
  const [valueMode, setValueMode] = useState<ValueMode>("normal");
  const [inputValue, setInputValue] = useState("");
  const [draftBets, setDraftBets] = useState<BetCalculated[]>([]);
  const [betErro, setBetErro] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState<{ code: string } | null>(null);

  const cfg = modalityConfig(modality);
  const drawsByLottery = useMemo(() => {
    const map = new Map<string, DrawOption[]>();
    for (const d of draws) {
      const list = map.get(d.lottery) ?? [];
      list.push(d);
      map.set(d.lottery, list);
    }
    return map;
  }, [draws]);
  const selectedDraw = draws.find((d) => drawKey(d) === drawSel) ?? null;

  useEffect(() => {
    if (!token || !user?.isCambista) return;
    request<{ clients: { id: string; name: string }[] }>("/api/cambista/clients", { token }).then((data) =>
      setClients(data.clients)
    );
  }, [token, user]);

  const total = draftBets.reduce((s, b) => s + b.total, 0);

  const previewValue = Number(inputValue.replace(",", "."));
  const previewUnits = numbers.length * (prizeTo - prizeFrom + 1);
  const previewUnitValue =
    previewUnits > 0 && previewValue > 0 ? (valueMode === "divide" ? previewValue / previewUnits : previewValue) : 0;
  const previewPayout = previewUnitValue > 0 ? potentialPayout(previewUnitValue, modality) : 0;

  function selectModality(id: ModalityId) {
    setModality(id);
    setNumbers([]);
    setNumberInput("");
    setBetErro(null);
  }

  function toggleGrupo(grupo: number) {
    const code = String(grupo).padStart(2, "0");
    setNumbers((prev) => (prev.includes(code) ? prev.filter((n) => n !== code) : [...prev, code]));
    setBetErro(null);
  }

  function pressDigit(d: string) {
    if (numberInput.length < cfg.size) setNumberInput(numberInput + d);
  }
  function commitNumber() {
    if (numberInput.length !== cfg.size) return;
    setNumbers((prev) => [...prev, numberInput]);
    setNumberInput("");
  }
  function removeNumber(n: string, idx: number) {
    setNumbers((prev) => prev.filter((_, i) => i !== idx));
  }

  function addBetToDraft() {
    setBetErro(null);
    const value = Number(inputValue.replace(",", "."));
    const input = { modality, numbers, prizeFrom, prizeTo, valueMode, inputValue: value };
    const error = validateBetInput(input);
    if (error) {
      setBetErro(error);
      return;
    }
    setDraftBets((prev) => [...prev, calculateBet(input)]);
    setNumbers([]);
    setNumberInput("");
    setInputValue("");
  }

  function removeDraftBet(idx: number) {
    setDraftBets((prev) => prev.filter((_, i) => i !== idx));
  }

  async function confirmPoule() {
    if (!selectedDraw || draftBets.length === 0) return;
    setErro(null);
    setEnviando(true);
    try {
      const { poule } = await request<{ poule: { code: string } }>("/api/poules", {
        method: "POST",
        token,
        body: JSON.stringify({
          lottery: selectedDraw.lottery,
          date: selectedDraw.date,
          time: selectedDraw.time,
          bets: draftBets,
          cambistaClientId: cambistaClientId || undefined,
          paymentMethod: user?.isCambista ? paymentMethod : undefined,
        }),
      });
      setSucesso({ code: poule.code });
      setDraftBets([]);
      setCambistaClientId("");
      setPaymentMethod("PIX");
      await refreshUser();
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível confirmar o pôule.");
    } finally {
      setEnviando(false);
    }
  }

  if (sucesso) {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <span className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-win/15 text-3xl text-win">
          ✓
        </span>
        <h2 className="text-2xl font-black">Pôule confirmado!</h2>
        <p className="mt-2 font-mono text-lg text-gold">{sucesso.code}</p>
        <div className="mt-6 flex flex-col gap-2">
          <Button size="lg" onClick={() => setSucesso(null)}>
            Fazer outro pôule
          </Button>
          <Link href="/poules">
            <Button variant="secondary" size="lg" className="w-full">
              Ver meus pôules
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <Card>
          <h2 className="mb-1 text-lg font-black">1. Escolha o sorteio</h2>
          <p className="mb-4 text-sm text-muted">Fechamento 15 minutos antes do horário.</p>
          {draws.length === 0 ? (
            <p className="text-sm text-muted">Nenhum sorteio aberto no momento.</p>
          ) : (
            [...drawsByLottery.entries()].map(([lottery, list]) => (
              <div key={lottery} className="mb-4 last:mb-0">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">{lottery}</p>
                <div className="flex flex-wrap gap-2">
                  {list.map((d) => {
                    const selected = drawKey(d) === drawSel;
                    return (
                      <button
                        key={drawKey(d)}
                        onClick={() => setDrawSel(drawKey(d))}
                        className={`rounded-lg border px-3 py-2 text-sm font-bold ${
                          selected ? "border-gold bg-gold text-navy" : "border-line bg-panel-2 hover:border-[#3c6da8]"
                        }`}
                      >
                        {formatDateBR(d.date)} • {d.time}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-black">2. Escolha a modalidade</h2>
          <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {MODALITIES.map((m) => (
              <button
                key={m.id}
                onClick={() => selectModality(m.id)}
                className={`rounded-xl border p-3 text-left ${
                  modality === m.id ? "border-gold bg-gold/10" : "border-line bg-panel-2 hover:border-[#3c6da8]"
                }`}
              >
                <b className="block text-sm">{m.label}</b>
                <span className="text-xs text-gold">{m.payoutRate}x</span>
              </button>
            ))}
          </div>
          <p className="mb-3 text-sm text-muted">{cfg.helpText}</p>

          {modality === "Grupo" ? (
            <div className="grid grid-cols-5 gap-2">
              {BICHOS.map((b) => {
                const code = String(b.grupo).padStart(2, "0");
                const selected = numbers.includes(code);
                return (
                  <button
                    key={b.grupo}
                    onClick={() => toggleGrupo(b.grupo)}
                    className={`overflow-hidden rounded-lg border ${
                      selected ? "border-2 border-gold" : "border-line hover:border-[#3c6da8]"
                    }`}
                  >
                    <Image
                      src={`/bichos/${code}.png`}
                      alt={`${code} - ${b.nome}`}
                      width={194}
                      height={150}
                      className="h-auto w-full"
                    />
                  </button>
                );
              })}
            </div>
          ) : (
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                {numbers.map((n, i) => (
                  <button
                    key={`${n}-${i}`}
                    onClick={() => removeNumber(n, i)}
                    className="rounded-lg border border-gold bg-gold/10 px-3 py-1.5 font-mono text-sm text-gold"
                    title="Remover"
                  >
                    {n} ✕
                  </button>
                ))}
              </div>
              <div className="mb-3 flex justify-center gap-2">
                {Array.from({ length: cfg.size }).map((_, i) => (
                  <span
                    key={i}
                    className={`flex size-12 items-center justify-center rounded-lg border text-xl font-black ${
                      numberInput[i] ? "border-gold bg-gold/10 text-gold" : "border-line bg-panel-2 text-muted"
                    }`}
                  >
                    {numberInput[i] ?? "•"}
                  </span>
                ))}
              </div>
              <div className="mx-auto grid max-w-xs grid-cols-3 gap-2">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                  <button
                    key={d}
                    onClick={() => pressDigit(d)}
                    className="h-11 rounded-lg border border-line bg-panel-2 font-bold hover:border-[#3c6da8]"
                  >
                    {d}
                  </button>
                ))}
                <button
                  onClick={() => setNumberInput("")}
                  className="h-11 rounded-lg border border-line bg-panel-2 text-xs font-bold text-muted"
                >
                  LIMPAR
                </button>
                <button
                  onClick={() => pressDigit("0")}
                  className="h-11 rounded-lg border border-line bg-panel-2 font-bold hover:border-[#3c6da8]"
                >
                  0
                </button>
                <button
                  onClick={() => setNumberInput(numberInput.slice(0, -1))}
                  className="h-11 rounded-lg border border-line bg-panel-2 font-bold hover:border-[#3c6da8]"
                >
                  ⌫
                </button>
              </div>
              <Button
                variant="secondary"
                className="mt-3 w-full"
                disabled={numberInput.length !== cfg.size}
                onClick={commitNumber}
              >
                Adicionar número
              </Button>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-black">3. Faixa de prêmios e valor</h2>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-[#c9d8ed]">De (1º ao...)</span>
              <select
                value={prizeFrom}
                onChange={(e) => setPrizeFrom(Number(e.target.value))}
                className="w-full rounded-lg border border-[#2d619f] bg-panel-2 p-3"
              >
                {PRIZE_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}º
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-[#c9d8ed]">Até</span>
              <select
                value={prizeTo}
                onChange={(e) => setPrizeTo(Number(e.target.value))}
                className="w-full rounded-lg border border-[#2d619f] bg-panel-2 p-3"
              >
                {PRIZE_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}º
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mb-1 grid grid-cols-2 gap-1 rounded-xl bg-panel-2 p-1">
            {(["normal", "divide"] as ValueMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setValueMode(mode)}
                className={`rounded-lg py-2.5 text-sm font-bold ${
                  valueMode === mode ? "bg-[#163a72] text-white" : "text-muted"
                }`}
              >
                {mode === "normal" ? "Valor por jogo" : "Dividir valor total"}
              </button>
            ))}
          </div>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-[13px] font-bold text-[#c9d8ed]">
              {valueMode === "normal" ? "Valor por jogo (R$)" : "Valor total a dividir (R$)"}
            </span>
            <input
              inputMode="decimal"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="0,00"
              className="w-full rounded-lg border border-[#2d619f] bg-panel-2 p-3"
            />
          </label>

          {betErro && <p className="mt-3 text-sm text-danger">{betErro}</p>}

          {previewPayout > 0 && (
            <p className="mt-4 rounded-lg border border-gold/30 bg-gold/10 p-3 text-center text-sm">
              Possível ganho por acerto: <b className="text-gold">{formatBRL(previewPayout)}</b>
            </p>
          )}

          <Button className="mt-4 w-full" size="lg" onClick={addBetToDraft} disabled={numbers.length === 0}>
            Adicionar jogo ao pôule
          </Button>
        </Card>
      </div>

      <div className="lg:sticky lg:top-[84px] lg:self-start">
        <Card>
          <h2 className="mb-1 text-lg font-black">Pôule</h2>
          <p className="mb-4 text-sm text-muted">
            Saldo disponível: <b className="text-gold">{formatBRL(balance)}</b>
          </p>

          {user?.isCambista && clients.length > 0 && (
            <label className="mb-4 block">
              <span className="mb-1.5 block text-[13px] font-bold text-[#c9d8ed]">Apostando para</span>
              <select
                value={cambistaClientId}
                onChange={(e) => setCambistaClientId(e.target.value)}
                className="w-full rounded-lg border border-[#2d619f] bg-panel-2 p-3"
              >
                <option value="">Para mim mesmo</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {user?.isCambista && (
            <label className="mb-4 block">
              <span className="mb-1.5 block text-[13px] font-bold text-[#c9d8ed]">Forma de pagamento</span>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-lg border border-[#2d619f] bg-panel-2 p-3"
              >
                <option value="PIX">Pix</option>
                <option value="DINHEIRO">Dinheiro</option>
                <option value="CARTAO">Cartão</option>
                <option value="FIADO">Fiado</option>
              </select>
            </label>
          )}

          {draftBets.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line p-5 text-center text-sm text-muted">
              Nenhum jogo adicionado ainda.
            </p>
          ) : (
            <div className="mb-4 space-y-2">
              {draftBets.map((bet, i) => (
                <div key={i} className="rounded-lg border border-line bg-panel-2 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <b>{bet.modality}</b>
                    <button onClick={() => removeDraftBet(i)} className="text-xs text-danger">
                      remover
                    </button>
                  </div>
                  <p className="mt-1 font-mono text-gold">{bet.numbers.join(", ")}</p>
                  <p className="mt-1 text-xs text-muted">
                    {bet.prizeFrom}º ao {bet.prizeTo}º • {bet.units} unidade(s) • {formatBRL(bet.unitValue)}/un
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Possível ganho: <b className="text-gold">{formatBRL(potentialPayout(bet.unitValue, bet.modality))}</b>
                  </p>
                  <p className="mt-1 font-bold">{formatBRL(bet.total)}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-line-soft pt-3">
            <span className="text-sm text-muted">Total</span>
            <b className="text-xl text-gold">{formatBRL(total)}</b>
          </div>

          {erro && <p className="mt-3 text-sm text-danger">{erro}</p>}

          <Button
            size="lg"
            className="mt-4 w-full"
            disabled={draftBets.length === 0 || !selectedDraw || total > balance || enviando}
            onClick={confirmPoule}
          >
            {enviando ? "Confirmando..." : "Confirmar pôule"}
          </Button>
          {total > balance && <p className="mt-2 text-center text-xs text-danger">Saldo insuficiente.</p>}
        </Card>
      </div>
    </div>
  );
}
