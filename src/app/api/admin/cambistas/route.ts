import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
  } catch {
    return Response.json({ error: "Acesso restrito." }, { status: 403 });
  }

  const cambistas = await prisma.user.findMany({
    where: { isCambista: true },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      cambistaCommissionPct: true,
      cambistaCode: true,
      _count: { select: { players: true } },
    },
    orderBy: { name: "asc" },
  });

  const sums = cambistas.length
    ? await prisma.cambistaEarning.groupBy({
        by: ["cambistaId"],
        where: { cambistaId: { in: cambistas.map((c) => c.id) } },
        _sum: { amount: true },
      })
    : [];

  const result = cambistas.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    cambistaCommissionPct: Number(c.cambistaCommissionPct),
    cambistaCode: c.cambistaCode,
    playerCount: c._count.players,
    commissionTotal: Number(sums.find((s) => s.cambistaId === c.id)?._sum.amount ?? 0),
  }));

  return Response.json({ cambistas: result });
}
