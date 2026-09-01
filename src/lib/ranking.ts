import "server-only";
import { prisma } from "./db";
import { maskName } from "./format";

export type WinnerRanking = { userId: string; name: string; total: number };

/** Top ganhadores por soma de prêmios pagos (pôules BATIDO), nome mascarado por privacidade. */
export async function getTopWinners(limit: number): Promise<WinnerRanking[]> {
  const grouped = await prisma.poule.groupBy({
    by: ["userId"],
    where: { status: "BATIDO" },
    _sum: { returnAmount: true },
    orderBy: { _sum: { returnAmount: "desc" } },
    take: limit,
  });
  if (grouped.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: grouped.map((g) => g.userId) } },
    select: { id: true, name: true },
  });
  const nameById = new Map(users.map((u) => [u.id, u.name]));

  return grouped
    .map((g) => ({
      userId: g.userId,
      name: maskName(nameById.get(g.userId) ?? "Jogador"),
      total: Number(g._sum.returnAmount ?? 0),
    }))
    .filter((w) => w.total > 0);
}
