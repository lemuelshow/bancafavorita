import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await requireUser(request);
  } catch {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const poule = await prisma.poule.findUnique({
    where: { id },
    include: {
      bets: true,
      draw: true,
      cambistaClient: { select: { name: true, phone: true } },
      user: { select: { name: true } },
    },
  });

  if (!poule || poule.userId !== user.id) {
    return Response.json({ error: "Pôule não encontrado." }, { status: 404 });
  }

  return Response.json({ poule });
}
