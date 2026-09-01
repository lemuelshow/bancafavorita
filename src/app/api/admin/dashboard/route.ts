import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
  } catch {
    return Response.json({ error: "Acesso restrito." }, { status: 403 });
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [clientCount, balanceSum, draws, novosCadastrosHoje, depositadoHojeAgg, apostadoHojeAgg, ultimasTransacoes] =
    await Promise.all([
      prisma.user.count({ where: { isAdmin: false } }),
      prisma.user.aggregate({ _sum: { balance: true }, where: { isAdmin: false } }),
      prisma.draw.findMany({
        include: { result: true, poules: { select: { total: true, returnAmount: true, status: true } } },
        orderBy: { drawAt: "desc" },
        take: 10,
      }),
      prisma.user.count({ where: { isAdmin: false, createdAt: { gte: startOfDay } } }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { kind: { in: ["DEPOSITO_PIX", "DEPOSITO_SIMULADO"] }, createdAt: { gte: startOfDay } },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { kind: "APOSTA", createdAt: { gte: startOfDay } },
      }),
      prisma.transaction.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { user: { select: { name: true } } },
      }),
    ]);

  return Response.json({
    clientCount,
    totalBalance: Number(balanceSum._sum.balance ?? 0),
    draws,
    hoje: {
      novosCadastros: novosCadastrosHoje,
      depositado: Number(depositadoHojeAgg._sum.amount ?? 0),
      apostado: Math.abs(Number(apostadoHojeAgg._sum.amount ?? 0)),
    },
    ultimasTransacoes,
  });
}
