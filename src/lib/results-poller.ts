import "server-only";
import { LOTTERIES, validTimes, toDateStr, drawInstant } from "./lotteries";
import { ingestResult } from "./results-ingest";

const POLL_INTERVAL_MS = 60_000;
const MAX_LOOKBACK_HOURS = 6; // não fica tentando indefinidamente um resultado muito antigo

let started = false;

/** Verifica sorteios já encerrados sem resultado e tenta buscar automaticamente na fonte oficial. */
async function tick() {
  const now = new Date();

  for (const lottery of LOTTERIES) {
    for (const daysAgo of [0, 1]) {
      const d = new Date(now);
      d.setUTCDate(d.getUTCDate() - daysAgo);
      const dateStr = toDateStr(d);

      for (const time of validTimes(lottery, dateStr)) {
        const drawAt = drawInstant(dateStr, time);
        if (now < drawAt) continue;

        const hoursSince = (now.getTime() - drawAt.getTime()) / 3_600_000;
        if (hoursSince > MAX_LOOKBACK_HOURS) continue;

        try {
          await ingestResult(lottery, dateStr, time);
        } catch {
          // silencioso: próxima rodada tenta de novo
        }
      }
    }
  }
}

export function startResultsPoller() {
  if (started) return;
  started = true;

  tick().catch(() => {});
  setInterval(() => {
    tick().catch(() => {});
  }, POLL_INTERVAL_MS);

  console.log("[results-poller] iniciado — verificando resultados a cada 60s");
}
