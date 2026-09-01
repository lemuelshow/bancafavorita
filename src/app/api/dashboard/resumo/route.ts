import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { getTopWinners } from "@/lib/ranking";
import type { TransactionKind } from "@prisma/client";

const DEPOSIT_WITHDRAW_KINDS: TransactionKind[] = ["DEPOSITO_PIX", "DEPOSITO_SIMULADO", "SAQUE_SIMULADO"];

export async function GET(request: Request) {
  let user;
  try {
    user = await requireUser(request);
  } catch {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [full, abertas, ganhouHoje, perdeuHoje, ultimaAposta, transacoes, topWinners] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { name: true, xp: true, balance: true } }),
    prisma.poule.count({ where: { userId: user.id, status: "AGUARDANDO" } }),
    prisma.poule.count({ where: { userId: user.id, status: "BATIDO", settledAt: { gte: startOfDay } } }),
    prisma.poule.count({ where: { userId: user.id, status: "PERDIDO", settledAt: { gte: startOfDay } } }),
    prisma.poule.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { code: true, total: true, status: true, createdAt: true, draw: { select: { lottery: true, time: true } } },
    }),
    prisma.transaction.findMany({
      where: { userId: user.id, kind: { in: DEPOSIT_WITHDRAW_KINDS } },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    getTopWinners(5),
  ]);

  return Response.json({
    name: full.name,
    xp: full.xp,
    balance: Number(full.balance),
    resumoApostas: { abertas, ganhouHoje, perdeuHoje },
    ultimaAposta,
    transacoes,
    topWinners,
  });
}
