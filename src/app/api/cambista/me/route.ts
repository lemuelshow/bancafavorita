import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  let user;
  try {
    user = await requireUser(request);
  } catch {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  const full = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!full.isCambista) {
    return Response.json({ error: "Você ainda não é cambista." }, { status: 403 });
  }

  const [playerCount, clientCount, earnings] = await Promise.all([
    prisma.user.count({ where: { cambistaId: user.id } }),
    prisma.cambistaClient.count({ where: { cambistaId: user.id } }),
    prisma.cambistaEarning.findMany({
      where: { cambistaId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const total = earnings.reduce((s, e) => s + Number(e.amount), 0);

  return Response.json({
    cambistaCode: full.cambistaCode,
    cambistaCommissionPct: Number(full.cambistaCommissionPct),
    playerCount,
    clientCount,
    total,
    earnings,
  });
}
