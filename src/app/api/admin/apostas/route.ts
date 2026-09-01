import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import type { Prisma, PouleStatus } from "@prisma/client";

const PAGE_SIZE = 20;
const VALID_STATUS = ["AGUARDANDO", "BATIDO", "PERDIDO"];

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
  } catch {
    return Response.json({ error: "Acesso restrito." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const status = searchParams.get("status");

  const where: Prisma.PouleWhereInput = status && VALID_STATUS.includes(status) ? { status: status as PouleStatus } : {};

  const [poules, total] = await Promise.all([
    prisma.poule.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            phone: true,
            isCambista: true,
            cambista: { select: { name: true } },
          },
        },
        cambistaClient: { select: { name: true } },
        draw: { select: { lottery: true, date: true, time: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.poule.count({ where }),
  ]);

  return Response.json({ poules, total, page, pageSize: PAGE_SIZE });
}
