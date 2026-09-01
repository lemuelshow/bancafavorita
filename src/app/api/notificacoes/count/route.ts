import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

const JANELA_DIAS = 7;

// Sinal real (não mockado): apostas do usuário resolvidas (ganhou/perdeu) nos últimos dias.
export async function GET(request: Request) {
  let user;
  try {
    user = await requireUser(request);
  } catch {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  const desde = new Date();
  desde.setDate(desde.getDate() - JANELA_DIAS);

  const count = await prisma.poule.count({
    where: { userId: user.id, status: { in: ["BATIDO", "PERDIDO"] }, settledAt: { gte: desde } },
  });

  return Response.json({ count });
}
