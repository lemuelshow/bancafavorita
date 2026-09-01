import "server-only";
import { prisma } from "./db";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem caracteres ambíguos (0/O, 1/I/L)

export function generateReferralCode(): string {
  let code = "";
  for (let i = 0; i < 8; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return code;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Ao cadastrar um novo usuário com código de indicação, credita o CPA do afiliado. */
export async function creditCpaForReferral(referralCode: string, newUserId: string): Promise<void> {
  const affiliate = await prisma.user.findUnique({ where: { referralCode } });
  if (!affiliate || !affiliate.isAffiliate) return;

  await prisma.user.update({ where: { id: newUserId }, data: { referredById: affiliate.id } });

  const cpa = Number(affiliate.affiliateCpa);
  if (cpa > 0) {
    await prisma.affiliateEarning.create({
      data: {
        affiliateId: affiliate.id,
        kind: "CPA",
        amount: cpa,
        description: "Comissão CPA — novo cadastro indicado",
      },
    });
  }
}

/**
 * Ao liquidar um pôule (vitória ou derrota), credita revenue share ao afiliado que
 * indicou o jogador, caso a casa tenha lucrado com esse pôule (total apostado > retorno pago).
 */
export async function creditRevShareForPoule(pouleId: string): Promise<void> {
  const poule = await prisma.poule.findUnique({
    where: { id: pouleId },
    include: { user: { include: { referredBy: true } } },
  });
  if (!poule) return;

  const referrer = poule.user.referredBy;
  if (!referrer || !referrer.isAffiliate) return;

  const revPct = Number(referrer.affiliateRevPct);
  if (revPct <= 0) return;

  const houseProfit = Number(poule.total) - Number(poule.returnAmount);
  if (houseProfit <= 0) return;

  const amount = round2(houseProfit * (revPct / 100));
  if (amount <= 0) return;

  await prisma.affiliateEarning.create({
    data: {
      affiliateId: referrer.id,
      kind: "REV",
      amount,
      description: `Revenue share — pôule ${poule.code}`,
    },
  });
}
