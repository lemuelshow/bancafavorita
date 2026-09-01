import "server-only";
import { toDateStr, type Lottery } from "./lotteries";

// FEDERAL já lista várias datas passadas numa página só. LOTEP/PARATODOS têm uma
// página "de hoje" e uma página por data (resultados-<banca>-do-dia-YYYY-MM-DD).
function sourceUrl(lottery: Lottery, dateStr: string): string {
  const isToday = dateStr === toDateStr(new Date());

  switch (lottery) {
    case "LOTEP PB":
      return isToday
        ? "https://www.resultadofacil.com.br/resultados-lotep-de-hoje"
        : `https://www.resultadofacil.com.br/resultados-lotep-do-dia-${dateStr}`;
    case "PARATODOS PB":
      return isToday
        ? "https://www.resultadofacil.com.br/resultados-paratodos-pb-de-hoje"
        : `https://www.resultadofacil.com.br/resultados-paratodos-pb-do-dia-${dateStr}`;
    case "FEDERAL":
      return "https://www.resultadofacil.com.br/resultado-banca-federal";
  }
}

export type ScrapeResult = { ok: true; prizes: string[] } | { ok: false; reason: string };

function toBrDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return stripHtml(await res.text());
  } finally {
    clearTimeout(timeout);
  }
}

/** Extrai os 5 primeiros prêmios (4 dígitos) a partir de um índice no texto. */
function extractFivePrizes(text: string, fromIndex: number): string[] | null {
  const window = text.slice(fromIndex, fromIndex + 700);
  const m = window.match(
    /1º\s+(\d{4})[\s\S]{0,120}?2º\s+(\d{4})[\s\S]{0,120}?3º\s+(\d{4})[\s\S]{0,120}?4º\s+(\d{4})[\s\S]{0,120}?5º\s+(\d{4})/
  );
  if (!m) return null;
  return [m[1], m[2], m[3], m[4], m[5]];
}

/** LOTEP/PARATODOS: cabeçalho "<...>, HH:MM[h] - Resultado do dia DD/MM/YYYY". */
function findByTimeAndDate(text: string, time: string, brDate: string): string[] | null {
  const [hh, mm] = time.split(":");
  const headerRe = /,\s*(?:\S+\s+)?(\d{1,2})(?::(\d{2}))?h?\s*-\s*Resultado do dia (\d{2}\/\d{2}\/\d{4})/g;
  let match: RegExpExecArray | null;
  while ((match = headerRe.exec(text))) {
    const foundHour = match[1].padStart(2, "0");
    const foundMinute = (match[2] ?? "00").padStart(2, "0");
    const foundDate = match[3];
    if (foundHour === hh && foundMinute === mm && foundDate === brDate) {
      return extractFivePrizes(text, headerRe.lastIndex);
    }
  }
  return null;
}

/** FEDERAL: cabeçalho "RESULTADO DA FEDERAL Jogo do Bicho de <dia da semana>, dia DD/MM/YYYY, 1º ao 5º". */
function findFederalByDate(text: string, brDate: string): string[] | null {
  const headerRe = /RESULTADO DA FEDERAL Jogo do Bicho de [^,]+? dia (\d{2}\/\d{2}\/\d{4}), 1º ao 5º/g;
  let match: RegExpExecArray | null;
  while ((match = headerRe.exec(text))) {
    if (match[1] === brDate) {
      return extractFivePrizes(text, headerRe.lastIndex);
    }
  }
  return null;
}

export async function scrapeResult(lottery: Lottery, dateStr: string, time: string): Promise<ScrapeResult> {
  const brDate = toBrDate(dateStr);

  let text: string;
  try {
    text = await fetchText(sourceUrl(lottery, dateStr));
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : "Falha ao acessar a fonte." };
  }

  const prizes = lottery === "FEDERAL" ? findFederalByDate(text, brDate) : findByTimeAndDate(text, time, brDate);

  if (!prizes) {
    return { ok: false, reason: `Resultado de ${lottery} ${time} do dia ${brDate} ainda não encontrado na fonte.` };
  }

  return { ok: true, prizes };
}
