import "server-only";
import crypto from "node:crypto";
import { prisma } from "./db";
import { createPixDeposit, getPixDepositStatus } from "./veopag";
import type { PublicUser } from "./types";

const MIN_AMOUNT = 1;
const MAX_AMOUNT = 20000;

export class InvalidAmountError extends Error {}

function externalIdFor(userId: string): string {
  return `bf-${userId}-${crypto.randomUUID()}`;
}

export async function startPixDeposit(user: PublicUser, amount: number) {
  if (!(amount >= MIN_AMOUNT) || amount > MAX_AMOUNT || !Number.isFinite(amount)) {
    throw new InvalidAmountError(`Informe um valor entre ${MIN_AMOUNT} e ${MAX_AMOUNT}.`);
  }

  const externalId = externalIdFor(user.id);
  const created = await createPixDeposit({
    amount,
    externalId,
    payer: { name: user.name, email: user.email ?? `${user.phone}@bancafavorita.local`, document: user.cpf },
    callbackUrl: process.env.VEOPAG_CALLBACK_URL,
  });

  const deposit = await prisma.pixDeposit.create({
    data: {
      userId: user.id,
      externalId,
      transactionId: created.transactionId,
      amount,
      fee: created.fee ?? null,
      qrcode: created.qrcode,
      status: "PENDING",
    },
  });

  return deposit;
}

/**
 * Fonte única de verdade para "pagamento confirmado": consulta o gateway e credita a
 * carteira de forma idempotente. Usada pelo webhook e pelo polling de fallback do cliente.
 */
export async function reconcilePixDeposit(externalId: string) {
  const local = await prisma.pixDeposit.findUnique({ where: { externalId } });
  if (!local) return null;
  if (local.status !== "PENDING") return local;

  const remote = await getPixDepositStatus(externalId);
  if (!remote) return local;

  if (remote.status === "COMPLETED") {
    // Credita o valor confirmado pelo gateway, não o originalmente solicitado — evita creditar
    // de mais caso o gateway reporte COMPLETED para um valor diferente do pedido.
    if (Math.abs(remote.amount - Number(local.amount)) > 0.01) {
      return prisma.pixDeposit.update({ where: { id: local.id }, data: { status: "FAILED" } });
    }

    return prisma.$transaction(async (tx) => {
      // updateMany com filtro de status garante que só um processo credita, mesmo em corrida
      // entre o webhook e o polling do cliente chegando ao mesmo tempo.
      const updated = await tx.pixDeposit.updateMany({
        where: { id: local.id, status: "PENDING" },
        data: { status: "COMPLETED", paidAt: new Date(), fee: remote.fee ?? undefined },
      });
      if (updated.count === 0) return tx.pixDeposit.findUniqueOrThrow({ where: { id: local.id } });

      await tx.user.update({ where: { id: local.userId }, data: { balance: { increment: remote.amount } } });
      await tx.transaction.create({
        data: {
          userId: local.userId,
          kind: "DEPOSITO_PIX",
          amount: remote.amount,
          description: `Depósito Pix confirmado — ${externalId}`,
        },
      });

      return tx.pixDeposit.findUniqueOrThrow({ where: { id: local.id } });
    });
  }

  if (remote.status === "FAILED") {
    return prisma.pixDeposit.update({ where: { id: local.id }, data: { status: "FAILED" } });
  }

  return local;
}
