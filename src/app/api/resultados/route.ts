import { prisma } from "@/lib/db";
import { ensureResultsForDate } from "@/lib/results-ingest";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import type { Lottery } from "@/lib/lotteries";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 8;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lottery = searchParams.get("lottery") as Lottery | null;
  const date = searchParams.get("date");
  const time = searchParams.get("time");
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  // Endpoint é público (rota de resultados vista por qualquer visitante), mas o filtro por data
  // dispara scraping na fonte externa + liquidação de pôules — limita por IP para impedir abuso
  // (martelar a fonte externa ou forçar liquidação/scraping repetidamente sem necessidade).
  if (date && date <= new Date().toISOString().slice(0, 10)) {
    if (rateLimit(`resultados:${clientIp(request)}`, 20, 60_000)) {
      await ensureResultsForDate(date, lottery ?? undefined);
    }
  }

  const drawWhere: Prisma.DrawWhereInput = {};
  if (lottery) drawWhere.lottery = lottery;
  if (date) drawWhere.date = new Date(`${date}T00:00:00Z`);
  if (time) drawWhere.time = time;

  const where: Prisma.ResultWhereInput = Object.keys(drawWhere).length > 0 ? { draw: drawWhere } : {};

  const [results, total] = await Promise.all([
    prisma.result.findMany({
      where,
      include: { draw: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.result.count({ where }),
  ]);

  return Response.json({ results, total, page, pageSize: PAGE_SIZE });
}
