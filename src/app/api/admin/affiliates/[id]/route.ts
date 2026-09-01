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
  const cpa = Number(body?.affiliateCpa);
  const revPct = Number(body?.affiliateRevPct);

  if (!Number.isFinite(cpa) || cpa < 0) {
    return Response.json({ error: "CPA inválido." }, { status: 400 });
  }
  if (!Number.isFinite(revPct) || revPct < 0 || revPct > 100) {
    return Response.json({ error: "REV deve ser entre 0 e 100." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || !user.isAffiliate) {
    return Response.json({ error: "Afiliado não encontrado." }, { status: 404 });
  }

  await prisma.user.update({ where: { id }, data: { affiliateCpa: cpa, affiliateRevPct: revPct } });

  return Response.json({ ok: true });
}
