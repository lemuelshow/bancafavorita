import "server-only";
import { prisma } from "./db";
import { calculateBet, validateBetInput, type BetInput } from "./betting";
import { closesAt, drawInstant } from "./lotteries";
import { generatePouleCode } from "./format";
import { creditCommissionForPoule } from "./cambistas";
import type { Lottery } from "./lotteries";

export class InsufficientBalanceError extends Error {}
export class DrawClosedError extends Error {}
export class InvalidCambistaClientError extends Error {}

export const PAYMENT_METHODS = ["PIX", "DINHEIRO", "CARTAO", "FIADO"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

type CreatePouleParams = {
  userId: string;
  lottery: Lottery;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  bets: BetInput[];
  cambistaClientId?: string | null;
  paymentMethod?: PaymentMethod | null;
};

export async function createPoule(params: CreatePouleParams) {
  const { userId, lottery, date, time, bets, cambistaClientId, paymentMethod } = params;

  if (bets.length === 0) throw new Error("Adicione ao menos um jogo ao pôule.");
  for (const bet of bets) {
    const error = validateBetInput(bet);
    if (error) throw new Error(error);
  }
  if (new Date() >= closesAt(date, time)) {
    throw new DrawClosedError("Este sorteio já fechou para novas apostas.");
  }

  const calculated = bets.map(calculateBet);
  const total = calculated.reduce((sum, b) => sum + b.total, 0);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    if (Number(user.balance) < total) throw new InsufficientBalanceError("Saldo insuficiente.");

    if (cambistaClientId) {
      const client = await tx.cambistaClient.findUnique({ where: { id: cambistaClientId } });
      if (!user.isCambista || !client || client.cambistaId !== userId) {
        throw new InvalidCambistaClientError("Cliente inválido.");
      }
    }

    const draw = await tx.draw.upsert({
      where: { lottery_date_time: { lottery, date: new Date(`${date}T00:00:00Z`), time } },
      update: {},
      create: { lottery, date: new Date(`${date}T00:00:00Z`), time, drawAt: drawInstant(date, time) },
    });

    let code = generatePouleCode();
    for (let i = 0; i < 5; i++) {
      const clash = await tx.poule.findUnique({ where: { code } });
      if (!clash) break;
      code = generatePouleCode();
    }

    const poule = await tx.poule.create({
      data: {
        code,
        userId,
        drawId: draw.id,
        total,
        cambistaClientId: cambistaClientId || null,
        paymentMethod: user.isCambista ? paymentMethod || null : null,
        bets: {
          create: calculated.map((b) => ({
            modality: b.modality,
            numbers: b.numbers,
            prizeFrom: b.prizeFrom,
            prizeTo: b.prizeTo,
            valueMode: b.valueMode,
            inputValue: b.inputValue,
            unitValue: b.unitValue,
            units: b.units,
            total: b.total,
          })),
        },
      },
      include: { bets: true, draw: true },
    });

    await tx.user.update({
      where: { id: userId },
      data: { balance: { decrement: total }, xp: { increment: Math.floor(total) } },
    });
    await tx.transaction.create({
      data: { userId, kind: "APOSTA", amount: -total, description: `Pôule ${poule.code} — ${lottery} ${time}` },
    });

    await creditCommissionForPoule(tx, userId, total, poule.code);

    return poule;
  }, { timeout: 15000, maxWait: 10000 });
}
