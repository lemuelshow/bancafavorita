import "server-only";
import { prisma } from "./db";
import { drawInstant, validTimes, LOTTERIES, type Lottery } from "./lotteries";
import { scrapeResult } from "./scraper";
import { settleDraw } from "./settlement";

export type IngestOutcome =
  | { status: "saved"; prizes: string[]; settledCount: number }
  | { status: "already-exists" }
  | { status: "not-found"; reason: string }
  | { status: "error"; reason: string };

// Evita martelar a fonte externa quando um sorteio ainda não tem resultado publicado lá:
// enquanto o cooldown não expira, chamadas repetidas (de qualquer IP) reusam o "not-found"
// em vez de disparar uma nova requisição de scraping.
const NEGATIVE_CACHE_TTL_MS = 30_000;
const negativeCache = new Map<string, { outcome: IngestOutcome; expiresAt: number }>();

/** Busca o resultado na fonte externa e, se encontrado, salva e confere os pôules do sorteio. */
export async function ingestResult(lottery: Lottery, dateStr: string, time: string): Promise<IngestOutcome> {
  const draw = await prisma.draw.upsert({
    where: { lottery_date_time: { lottery, date: new Date(`${dateStr}T00:00:00Z`), time } },
    update: {},
    create: { lottery, date: new Date(`${dateStr}T00:00:00Z`), time, drawAt: drawInstant(dateStr, time) },
  });

  const existing = await prisma.result.findUnique({ where: { drawId: draw.id } });
  if (existing) return { status: "already-exists" };

  const cacheKey = `${lottery}:${dateStr}:${time}`;
  const cached = negativeCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.outcome;

  let scraped;
  try {
    scraped = await scrapeResult(lottery, dateStr, time);
  } catch (error) {
    const outcome: IngestOutcome = {
      status: "error",
      reason: error instanceof Error ? error.message : "Falha inesperada na busca.",
    };
    negativeCache.set(cacheKey, { outcome, expiresAt: Date.now() + NEGATIVE_CACHE_TTL_MS });
    return outcome;
  }

  if (!scraped.ok) {
    const outcome: IngestOutcome = { status: "not-found", reason: scraped.reason };
    negativeCache.set(cacheKey, { outcome, expiresAt: Date.now() + NEGATIVE_CACHE_TTL_MS });
    return outcome;
  }

  await prisma.result.create({ data: { drawId: draw.id, prizes: scraped.prizes, source: "AUTOMÁTICO" } });
  const settledCount = await settleDraw(draw.id, scraped.prizes);

  return { status: "saved", prizes: scraped.prizes, settledCount };
}

/**
 * Garante que os resultados de uma data específica estejam no banco, buscando na fonte
 * externa qualquer sorteio já encerrado que ainda não tenha resultado salvo. Usado quando
 * o jogador filtra por uma data que o poller automático ainda não capturou (ex.: dias
 * anteriores ao início do sistema). Chamadas repetidas para uma data já completa são
 * baratas, pois `ingestResult` verifica o banco antes de acessar a fonte externa.
 */
export async function ensureResultsForDate(dateStr: string, lotteryFilter?: Lottery): Promise<void> {
  const now = new Date();
  const lotteries = lotteryFilter ? [lotteryFilter] : LOTTERIES;

  await Promise.all(
    lotteries.flatMap((lottery) =>
      validTimes(lottery, dateStr)
        .filter((time) => drawInstant(dateStr, time) <= now)
        .map((time) => ingestResult(lottery, dateStr, time).catch(() => {}))
    )
  );
}
