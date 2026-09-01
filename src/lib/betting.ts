import { grupoFromDezena } from "./animals";
import { modalityConfig, type ModalityId } from "./modalities";

export type ValueMode = "normal" | "divide";

export type BetInput = {
  modality: ModalityId;
  numbers: string[];
  prizeFrom: number; // 1..5
  prizeTo: number; // 1..5
  valueMode: ValueMode;
  inputValue: number;
};

export type BetCalculated = BetInput & {
  unitValue: number;
  units: number;
  total: number;
};

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Fase 1: Milhar/Centena/Dezena/Grupo não têm combinatória especial —
 * cada número entrado é um jogo próprio. units = quantidade de números × faixa de prêmios.
 */
export function calculateBet(input: BetInput): BetCalculated {
  const combos = input.numbers.length;
  const prizeRange = input.prizeTo - input.prizeFrom + 1;
  const units = combos * prizeRange;

  if (input.valueMode === "divide") {
    const unitValue = round2(input.inputValue / units);
    return { ...input, unitValue, units, total: round2(input.inputValue) };
  }

  const unitValue = round2(input.inputValue);
  return { ...input, unitValue, units, total: round2(unitValue * units) };
}

/** Retorno (R$) se um único número/posição desse jogo acertar — o "possível ganho" exibido ao apostador. */
export function potentialPayout(unitValue: number, modality: ModalityId): number {
  return round2(unitValue * modalityConfig(modality).payoutRate);
}

export function validateBetInput(input: BetInput): string | null {
  const cfg = modalityConfig(input.modality);

  if (input.numbers.length < cfg.min) return `Informe pelo menos ${cfg.min} número(s) para ${cfg.label}.`;
  if (input.numbers.length > cfg.max) return `No máximo ${cfg.max} números por jogo em ${cfg.label}.`;
  for (const n of input.numbers) {
    if (!/^\d+$/.test(n) || n.length !== cfg.size) {
      return `Cada número de ${cfg.label} deve ter ${cfg.size} dígito(s).`;
    }
    if (cfg.id === "Grupo") {
      const grupo = Number(n);
      if (grupo < 1 || grupo > 25) return "Grupo inválido — use de 01 a 25.";
    }
  }
  if (input.prizeFrom < 1 || input.prizeTo > 5 || input.prizeFrom > input.prizeTo) {
    return "Faixa de prêmios inválida (1º ao 5º).";
  }
  if (!(input.inputValue > 0)) return "Informe um valor maior que zero.";
  return null;
}

/** Confere um jogo já calculado contra os 5 prêmios do sorteio e retorna o prêmio ganho (R$). */
export function settleBet(bet: BetCalculated, prizes: string[]): number {
  const cfg = modalityConfig(bet.modality);
  let payout = 0;

  for (let pos = bet.prizeFrom; pos <= bet.prizeTo; pos++) {
    const prize = prizes[pos - 1];
    if (!prize) continue;

    for (const n of bet.numbers) {
      let hit = false;
      switch (bet.modality) {
        case "Milhar":
          hit = n === prize;
          break;
        case "Centena":
          hit = n === prize.slice(-3);
          break;
        case "Dezena":
          hit = n.padStart(2, "0") === prize.slice(-2);
          break;
        case "Grupo":
          hit = Number(n) === grupoFromDezena(Number(prize.slice(-2)));
          break;
      }
      if (hit) payout += bet.unitValue * cfg.payoutRate;
    }
  }

  return round2(payout);
}
