import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

function sum(list: { amount: unknown }[]): number {
  return list.reduce((s, t) => s + Number(t.amount), 0);
}

type DaySeriesRow = { day: Date; depositado: number; apostado: number; premios: number };

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
  } catch {
    return Response.json({ error: "Acesso restrito." }, { status: 403 });
  }

  const [
    depositos,
    saques,
    apostas,
    premios,
    cambistaEarnings,
    affiliateEarnings,
    saldoAgg,
    series,
  ] = await Promise.all([
    prisma.transaction.findMany({ where: { kind: { in: ["DEPOSITO_PIX", "DEPOSITO_SIMULADO"] } }, select: { amount: true } }),
    prisma.transaction.findMany({ where: { kind: "SAQUE_SIMULADO" }, select: { amount: true } }),
    prisma.transaction.findMany({ where: { kind: "APOSTA" }, select: { amount: true } }),
    prisma.transaction.findMany({ where: { kind: "PREMIO" }, select: { amount: true } }),
    prisma.cambistaEarning.findMany({ select: { amount: true } }),
    prisma.affiliateEarning.findMany({ select: { amount: true, kind: true } }),
    prisma.user.aggregate({ _sum: { balance: true } }),
    prisma.$queryRaw<DaySeriesRow[]>`
      SELECT
        date_trunc('day', "createdAt") AS day,
        COALESCE(SUM(amount) FILTER (WHERE kind IN ('DEPOSITO_PIX', 'DEPOSITO_SIMULADO')), 0) AS depositado,
        COALESCE(SUM(-amount) FILTER (WHERE kind = 'APOSTA'), 0) AS apostado,
        COALESCE(SUM(amount) FILTER (WHERE kind = 'PREMIO'), 0) AS premios
      FROM "Transaction"
      WHERE "createdAt" >= now() - interval '30 days'
      GROUP BY 1
      ORDER BY 1
    `,
  ]);

  const totalDepositado = sum(depositos);
  const totalSacado = Math.abs(sum(saques));
  const totalApostado = Math.abs(sum(apostas));
  const totalPremiosPagos = sum(premios);
  const totalComissaoCambista = sum(cambistaEarnings);
  const totalCpaAfiliado = sum(affiliateEarnings.filter((e) => e.kind === "CPA"));
  const totalRevAfiliado = sum(affiliateEarnings.filter((e) => e.kind === "REV"));
  const saldoTotalCarteiras = Number(saldoAgg._sum.balance ?? 0);
  const lucroBruto =
    totalApostado - totalPremiosPagos - totalComissaoCambista - totalCpaAfiliado - totalRevAfiliado;

  return Response.json({
    totalDepositado,
    totalSacado,
    totalApostado,
    totalPremiosPagos,
    totalComissaoCambista,
    totalCpaAfiliado,
    totalRevAfiliado,
    saldoTotalCarteiras,
    lucroBruto,
    series: series.map((r) => ({
      day: r.day,
      depositado: Number(r.depositado),
      apostado: Number(r.apostado),
      premios: Number(r.premios),
    })),
  });
}
