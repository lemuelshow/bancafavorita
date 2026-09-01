import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { generateCambistaCode } from "@/lib/cambistas";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
  } catch {
    return Response.json({ error: "Acesso restrito." }, { status: 403 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return Response.json({ error: "Usuário não encontrado." }, { status: 404 });

  if (user.isCambista) {
    const updated = await prisma.user.update({ where: { id }, data: { isCambista: false } });
    return Response.json({ isCambista: updated.isCambista });
  }

  let cambistaCode = user.cambistaCode;
  if (!cambistaCode) {
    for (let i = 0; i < 5; i++) {
      const candidate = generateCambistaCode();
      const clash = await prisma.user.findUnique({ where: { cambistaCode: candidate } });
      if (!clash) {
        cambistaCode = candidate;
        break;
      }
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isCambista: true, cambistaCode },
  });

  return Response.json({ isCambista: updated.isCambista, cambistaCode: updated.cambistaCode });
}
