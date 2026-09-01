export type ModalityId = "Milhar" | "Centena" | "Dezena" | "Grupo";

export type ModalityConfig = {
  id: ModalityId;
  size: number; // dígitos por número
  min: number; // quantidade mínima de números por jogo
  max: number; // quantidade máxima de números por jogo
  payoutRate: number; // retorno em R$ por R$1 apostado, se acertar
  label: string;
  helpText: string;
};

// Cotações oficiais centralizadas (mesmos valores da versão anterior do sistema).
export const MODALITIES: ModalityConfig[] = [
  {
    id: "Milhar",
    size: 4,
    min: 1,
    max: 20,
    payoutRate: 9000,
    label: "Milhar",
    helpText: "Escolha um ou mais números de 4 dígitos (0000–9999).",
  },
  {
    id: "Centena",
    size: 3,
    min: 1,
    max: 20,
    payoutRate: 900,
    label: "Centena",
    helpText: "Escolha um ou mais números de 3 dígitos (000–999).",
  },
  {
    id: "Dezena",
    size: 2,
    min: 1,
    max: 20,
    payoutRate: 90,
    label: "Dezena",
    helpText: "Escolha uma ou mais dezenas (00–99).",
  },
  {
    id: "Grupo",
    size: 2,
    min: 1,
    max: 25,
    payoutRate: 22,
    label: "Grupo",
    helpText: "Escolha um ou mais dos 25 animais.",
  },
];

export function modalityConfig(id: ModalityId): ModalityConfig {
  const m = MODALITIES.find((x) => x.id === id);
  if (!m) throw new Error(`Modalidade desconhecida: ${id}`);
  return m;
}

export const VALUE_MODE_LABEL: Record<"normal" | "divide", string> = {
  normal: "Valor por jogo",
  divide: "Dividir valor total entre os jogos",
};
