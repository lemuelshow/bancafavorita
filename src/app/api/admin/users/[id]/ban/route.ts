import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
  } catch {
    return Response.json({ error: "Acesso restrito." }, { status: 403 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return Response.json({ error: "Usuário não encontrado." }, { status: 404 });

  const updated = await prisma.user.update({
    where: { id },
    data: { bannedAt: user.bannedAt ? null : new Date() },
  });

  return Response.json({ bannedAt: updated.bannedAt });
}
