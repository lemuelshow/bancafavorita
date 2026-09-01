import { requireAdmin } from "@/lib/auth-server";
import { ingestResult } from "@/lib/results-ingest";
import type { Lottery } from "@/lib/lotteries";

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

  if (!lottery || !date || !time) {
    return Response.json({ error: "Selecione loteria, data e horário." }, { status: 400 });
  }

  const outcome = await ingestResult(lottery, date, time);

  switch (outcome.status) {
    case "saved":
      return Response.json({ prizes: outcome.prizes, settledCount: outcome.settledCount }, { status: 201 });
    case "already-exists":
      return Response.json({ error: "Este sorteio já tem resultado cadastrado." }, { status: 409 });
    case "not-found":
      return Response.json({ error: outcome.reason }, { status: 404 });
    case "error":
      return Response.json({ error: outcome.reason }, { status: 502 });
  }
}
