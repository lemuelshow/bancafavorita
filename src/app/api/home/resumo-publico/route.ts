import { prisma } from "@/lib/db";
import { listUpcomingDraws } from "@/lib/lotteries";

export const dynamic = "force-dynamic";

const LIMITE = 4;

export async function GET() {
  const proximos = listUpcomingDraws().slice(0, LIMITE);

  const proximosSorteios = await Promise.all(
    proximos.map(async (d) => {
      const draw = await prisma.draw.findUnique({
        where: { lottery_date_time: { lottery: d.lottery, date: new Date(`${d.date}T00:00:00Z`), time: d.time } },
        include: { poules: { select: { total: true } } },
      });
      const acumulado = draw ? draw.poules.reduce((s, p) => s + Number(p.total), 0) : 0;
      return {
        lottery: d.lottery,
        date: d.date,
        time: d.time,
        drawAt: d.drawAt.toISOString(),
        acumulado,
      };
    })
  );

  const results = await prisma.result.findMany({
    include: { draw: true },
    orderBy: { createdAt: "desc" },
    take: LIMITE,
  });

  const resultadosRecentes = await Promise.all(
    results.map(async (r) => {
      const pago = await prisma.poule.aggregate({
        where: { drawId: r.drawId, status: "BATIDO" },
        _sum: { returnAmount: true },
      });
      return {
        id: r.id,
        prizes: r.prizes,
        draw: { lottery: r.draw.lottery, date: r.draw.date.toISOString(), time: r.draw.time },
        totalPago: Number(pago._sum.returnAmount ?? 0),
      };
    })
  );

  return Response.json({ proximosSorteios, resultadosRecentes });
}
