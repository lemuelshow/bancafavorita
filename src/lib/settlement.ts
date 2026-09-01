import "server-only";
import { prisma } from "./db";
import { settleBet, type BetCalculated } from "./betting";
import { creditRevShareForPoule } from "./affiliates";
import type { ModalityId } from "./modalities";

/** Confere todos os pôules AGUARDANDO de um sorteio contra os 5 prêmios e credita ganhadores. */
export async function settleDraw(drawId: string, prizes: string[]) {
  const poules = await prisma.poule.findMany({
    where: { drawId, status: "AGUARDANDO" },
    include: { bets: true },
  });

  for (const poule of poules) {
    const wonBets: { id: string; payout: number }[] = [];
    let returnAmount = 0;

    for (const bet of poule.bets) {
      const calculated: BetCalculated = {
        modality: bet.modality as ModalityId,
        numbers: bet.numbers,
        prizeFrom: bet.prizeFrom,
        prizeTo: bet.prizeTo,
        valueMode: bet.valueMode as "normal" | "divide",
        inputValue: Number(bet.inputValue),
        unitValue: Number(bet.unitValue),
        units: bet.units,
        total: Number(bet.total),
      };
      const payout = settleBet(calculated, prizes);
      if (payout > 0) {
        wonBets.push({ id: bet.id, payout });
        returnAmount += payout;
      }
    }

    const won = returnAmount > 0;

    // Tudo isso precisa ser tudo-ou-nada: se o processo cair no meio, uma poule marcada
    // BATIDO/PERDIDO sem o crédito correspondente nunca mais seria reprocessada (fica
    // permanentemente fora do status AGUARDANDO), causando perda real de saldo do ganhador.
    await prisma.$transaction(async (tx) => {
      for (const bet of wonBets) {
        await tx.bet.update({ where: { id: bet.id }, data: { won: true, payout: bet.payout } });
      }

      await tx.poule.update({
        where: { id: poule.id },
        data: { status: won ? "BATIDO" : "PERDIDO", returnAmount, settledAt: new Date() },
      });

      if (won) {
        await tx.user.update({ where: { id: poule.userId }, data: { balance: { increment: returnAmount } } });
        await tx.transaction.create({
          data: {
            userId: poule.userId,
            kind: "PREMIO",
            amount: returnAmount,
            description: `Prêmio do pôule ${poule.code}`,
          },
        });
      }
    });

    await creditRevShareForPoule(poule.id).catch((error) => {
      console.error(`[settlement] falha ao creditar rev-share do pôule ${poule.id}:`, error);
    });
  }

  return poules.length;
}
