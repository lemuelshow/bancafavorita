export type Bicho = { grupo: number; nome: string; emoji: string };

const NOMES_E_EMOJIS: [string, string][] = [
  ["Avestruz", "🐦"],
  ["Águia", "🦅"],
  ["Burro", "🦓"],
  ["Borboleta", "🦋"],
  ["Cachorro", "🐶"],
  ["Cabra", "🐐"],
  ["Carneiro", "🐏"],
  ["Camelo", "🐫"],
  ["Cobra", "🐍"],
  ["Coelho", "🐰"],
  ["Cavalo", "🐴"],
  ["Elefante", "🐘"],
  ["Galo", "🐓"],
  ["Gato", "🐱"],
  ["Jacaré", "🐊"],
  ["Leão", "🦁"],
  ["Macaco", "🐵"],
  ["Porco", "🐷"],
  ["Pavão", "🦚"],
  ["Peru", "🦃"],
  ["Touro", "🐂"],
  ["Tigre", "🐯"],
  ["Urso", "🐻"],
  ["Veado", "🦌"],
  ["Vaca", "🐄"],
];

export const BICHOS: Bicho[] = NOMES_E_EMOJIS.map(([nome, emoji], i) => ({ grupo: i + 1, nome, emoji }));

/** Grupo (1-25) a partir de uma dezena (0-99). Dezena 00 pertence ao grupo 25. */
export function grupoFromDezena(dezena: number): number {
  return dezena === 0 ? 25 : Math.floor((dezena - 1) / 4) + 1;
}

export function bichoFromGrupo(grupo: number): Bicho {
  const b = BICHOS.find((x) => x.grupo === grupo);
  if (!b) throw new Error(`Grupo inválido: ${grupo}`);
  return b;
}

/** Bicho correspondente às duas últimas casas de um prêmio (string de 4 dígitos). */
export function bichoFromPrize(prize: string): Bicho {
  const dezena = Number(prize.slice(-2));
  return bichoFromGrupo(grupoFromDezena(dezena));
}
