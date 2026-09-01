// Horários das extrações. FEDERAL só sai quarta (20:00) e domingo (11:00).
// Fuso fixo America/Recife (UTC-3, sem horário de verão no Brasil desde 2019).

export const LOTTERIES = ["LOTEP PB", "PARATODOS PB", "FEDERAL"] as const;
export type Lottery = (typeof LOTTERIES)[number];

const FIXED_TIMES: Record<Exclude<Lottery, "FEDERAL">, string[]> = {
  "LOTEP PB": ["10:45", "12:45", "15:45", "18:00"],
  "PARATODOS PB": ["09:45", "20:00"],
};

const CLOSE_MINUTES_BEFORE = 15;

export function toDateStr(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Recife" }).format(d);
}

/** Horários válidos de uma loteria numa data (YYYY-MM-DD), no fuso America/Recife. */
export function validTimes(lottery: Lottery, dateStr: string): string[] {
  if (lottery !== "FEDERAL") return FIXED_TIMES[lottery];

  const weekday = new Date(`${dateStr}T12:00:00-03:00`).getUTCDay(); // meio-dia evita virada de dia por fuso
  if (weekday === 3) return ["20:00"]; // quarta
  if (weekday === 0) return ["11:00"]; // domingo
  return [];
}

/** Instante exato (UTC) do sorteio, no fuso America/Recife. */
export function drawInstant(dateStr: string, time: string): Date {
  return new Date(`${dateStr}T${time}:00-03:00`);
}

export function closesAt(dateStr: string, time: string): Date {
  return new Date(drawInstant(dateStr, time).getTime() - CLOSE_MINUTES_BEFORE * 60_000);
}

export function isDrawOpen(dateStr: string, time: string, now: Date = new Date()): boolean {
  return now < closesAt(dateStr, time);
}

export type UpcomingDraw = { lottery: Lottery; date: string; time: string; drawAt: Date; closesAt: Date };

/** Lista as próximas extrações abertas (todas as loterias), olhando até `daysAhead` dias à frente. */
export function listUpcomingDraws(now: Date = new Date(), daysAhead = 3): UpcomingDraw[] {
  const draws: UpcomingDraw[] = [];
  for (let i = 0; i <= daysAhead; i++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() + i);
    const dateStr = toDateStr(d);
    for (const lottery of LOTTERIES) {
      for (const time of validTimes(lottery, dateStr)) {
        const drawAt = drawInstant(dateStr, time);
        const close = closesAt(dateStr, time);
        if (now < close) {
          draws.push({ lottery, date: dateStr, time, drawAt, closesAt: close });
        }
      }
    }
  }
  return draws.sort((a, b) => a.drawAt.getTime() - b.drawAt.getTime());
}

export function nextOpenDraw(now: Date = new Date()): UpcomingDraw | null {
  return listUpcomingDraws(now, 14)[0] ?? null;
}
