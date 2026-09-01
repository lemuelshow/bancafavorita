import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import {
  createPoule,
  DrawClosedError,
  InsufficientBalanceError,
  InvalidCambistaClientError,
  PAYMENT_METHODS,
  type PaymentMethod,
} from "@/lib/poules";
import type { Lottery } from "@/lib/lotteries";
import type { ModalityId } from "@/lib/modalities";

export async function GET(request: Request) {
  let user;
  try {
    user = await requireUser(request);
  } catch {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  const poules = await prisma.poule.findMany({
    where: { userId: user.id },
    include: { draw: true, bets: true, cambistaClient: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return Response.json({ poules });
}

export async function POST(request: Request) {
  let user;
  try {
    user = await requireUser(request);
  } catch {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }
  if (user.isAdmin) return Response.json({ error: "Administradores não podem apostar." }, { status: 403 });

  const body = await request.json().catch(() => null);
  const lottery = body?.lottery as Lottery;
  const date = typeof body?.date === "string" ? body.date : "";
  const time = typeof body?.time === "string" ? body.time : "";
  const bets = Array.isArray(body?.bets)
    ? body.bets.map((b: Record<string, unknown>) => ({
        modality: b.modality as ModalityId,
        numbers: Array.isArray(b.numbers) ? (b.numbers as string[]) : [],
        prizeFrom: Number(b.prizeFrom),
        prizeTo: Number(b.prizeTo),
        valueMode: b.valueMode === "divide" ? "divide" : "normal",
        inputValue: Number(b.inputValue),
      }))
    : [];
  const cambistaClientId = typeof body?.cambistaClientId === "string" ? body.cambistaClientId : null;
  const paymentMethod: PaymentMethod | null =
    typeof body?.paymentMethod === "string" && (PAYMENT_METHODS as readonly string[]).includes(body.paymentMethod)
      ? (body.paymentMethod as PaymentMethod)
      : null;

  if (!lottery || !date || !time) {
    return Response.json({ error: "Selecione o sorteio." }, { status: 400 });
  }

  try {
    const poule = await createPoule({ userId: user.id, lottery, date, time, bets, cambistaClientId, paymentMethod });
    return Response.json({ poule }, { status: 201 });
  } catch (error) {
    if (error instanceof InsufficientBalanceError) return Response.json({ error: error.message }, { status: 422 });
    if (error instanceof DrawClosedError) return Response.json({ error: error.message }, { status: 409 });
    if (error instanceof InvalidCambistaClientError) return Response.json({ error: error.message }, { status: 400 });
    const message = error instanceof Error ? error.message : "Não foi possível confirmar o pôule.";
    return Response.json({ error: message }, { status: 400 });
  }
}
