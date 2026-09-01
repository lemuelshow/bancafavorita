import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
  } catch {
    return Response.json({ error: "Acesso restrito." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const pct = Number(body?.cambistaCommissionPct);

  if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
    return Response.json({ error: "Comissão deve ser entre 0 e 100." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || !user.isCambista) {
    return Response.json({ error: "Cambista não encontrado." }, { status: 404 });
  }

  await prisma.user.update({ where: { id }, data: { cambistaCommissionPct: pct } });

  return Response.json({ ok: true });
}
