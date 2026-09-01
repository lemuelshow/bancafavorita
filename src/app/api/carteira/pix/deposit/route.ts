import { requireUser } from "@/lib/auth-server";
import { startPixDeposit, InvalidAmountError } from "@/lib/pix";

export async function POST(request: Request) {
  let user;
  try {
    user = await requireUser(request);
  } catch {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const amount = Number(body?.amount);

  try {
    const deposit = await startPixDeposit(user, amount);
    return Response.json(
      { externalId: deposit.externalId, qrcode: deposit.qrcode, amount: Number(deposit.amount), status: deposit.status },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof InvalidAmountError) return Response.json({ error: error.message }, { status: 400 });
    const message = error instanceof Error ? error.message : "Não foi possível gerar a cobrança Pix.";
    return Response.json({ error: message }, { status: 502 });
  }
}
