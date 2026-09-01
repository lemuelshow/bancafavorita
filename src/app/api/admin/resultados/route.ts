import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { drawInstant } from "@/lib/lotteries";
import { settleDraw } from "@/lib/settlement";
import type { Lottery } from "@/lib/lotteries";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
  } catch {
    return Response.json({ error: "Acesso restrito." }, { status: 403 });
  }

  const results = await prisma.result.findMany({
    include: { draw: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return Response.json({ results });
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
  } catch {
    return Response.json({ error: "Acesso restrito." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const lottery = body?.lottery as Lottery;
  const date = typeof body?.date === "string" ? body.date : "";
  const time = typeof body?.time === "string" ? body.time : "";
  const prizes = Array.isArray(body?.prizes) ? (body.prizes as string[]) : [];

  if (!lottery || !date || !time) {
    return Response.json({ error: "Selecione loteria, data e horário." }, { status: 400 });
  }
  if (prizes.length !== 5 || prizes.some((p) => !/^\d{4}$/.test(p))) {
    return Response.json({ error: "Informe os 5 prêmios, cada um com 4 dígitos." }, { status: 400 });
  }

  const draw = await prisma.draw.upsert({
    where: { lottery_date_time: { lottery, date: new Date(`${date}T00:00:00Z`), time } },
    update: {},
    create: { lottery, date: new Date(`${date}T00:00:00Z`), time, drawAt: drawInstant(date, time) },
  });

  const existing = await prisma.result.findUnique({ where: { drawId: draw.id } });
  if (existing) {
    return Response.json({ error: "Este sorteio já tem resultado cadastrado." }, { status: 409 });
  }

  const result = await prisma.result.create({ data: { drawId: draw.id, prizes } });
  const settledCount = await settleDraw(draw.id, prizes);

  return Response.json({ result, settledCount }, { status: 201 });
}
