import { verifyWebhookSignature } from "@/lib/veopag";
import { reconcilePixDeposit } from "@/lib/pix";

// Endpoint público (chamado pelo gateway VeoPag) — autenticado via assinatura HMAC, não por sessão.
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-webhook-signature") ?? "";
  const timestamp = request.headers.get("x-webhook-timestamp") ?? "";

  if (!(await verifyWebhookSignature(rawBody, timestamp, signature))) {
    return Response.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  let body: { external_id?: unknown } | null;
  try {
    body = JSON.parse(rawBody || "{}");
  } catch {
    return Response.json({ ok: true });
  }

  const externalId = body?.external_id;
  if (typeof externalId !== "string" || !externalId) {
    // Confirmamos recebimento mesmo sem external_id reconhecível para não gerar retries infinitos.
    return Response.json({ ok: true });
  }

  try {
    await reconcilePixDeposit(externalId);
  } catch {
    // Não propaga erro ao gateway — o polling de fallback do cliente também reconcilia.
  }

  return Response.json({ ok: true });
}
