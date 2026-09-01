import "server-only";
import { prisma } from "./db";
import type { Prisma } from "@prisma/client";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem caracteres ambíguos (0/O, 1/I/L)

export function generateCambistaCode(): string {
  let code = "";
  for (let i = 0; i < 8; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return code;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Ao cadastrar um novo usuário com código de cambista, atribui o jogador a ele. */
export async function attributeCambista(cambistaCode: string, newUserId: string): Promise<void> {
  const cambista = await prisma.user.findUnique({ where: { cambistaCode } });
  if (!cambista || !cambista.isCambista) return;
  await prisma.user.update({ where: { id: newUserId }, data: { cambistaId: cambista.id } });
}

/**
 * Credita a comissão do cambista sobre o valor apostado por um jogador atribuído a ele.
 * Diferente do REV de afiliado, a comissão é paga no ato da aposta, independente do resultado
 * do sorteio (o cambista ganha por "passar o jogo", não pelo lucro da casa).
 */
export async function creditCommissionForPoule(
  tx: Prisma.TransactionClient,
  userId: string,
  pouleTotal: number,
  pouleCode: string
): Promise<void> {
  const player = await tx.user.findUnique({ where: { id: userId }, include: { cambista: true } });
  const cambista = player?.cambista;
  if (!cambista || !cambista.isCambista) return;

  const pct = Number(cambista.cambistaCommissionPct);
  if (pct <= 0) return;

  const amount = round2(pouleTotal * (pct / 100));
  if (amount <= 0) return;

  await tx.cambistaEarning.create({
    data: {
      cambistaId: cambista.id,
      amount,
      description: `Comissão — pôule ${pouleCode}`,
    },
  });
}
