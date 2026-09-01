import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { invalidateTokenCache } from "@/lib/veopag";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
  } catch {
    return Response.json({ error: "Acesso restrito." }, { status: 403 });
  }

  const s = await prisma.gatewaySettings.findUnique({ where: { id: "singleton" } });

  return Response.json({
    veopagClientId: s?.veopagClientId ?? "",
    veopagCallbackUrl: s?.veopagCallbackUrl ?? "",
    hasClientSecret: !!s?.veopagClientSecret,
    hasWebhookSecret: !!s?.veopagWebhookSecret,
  });
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
  } catch {
    return Response.json({ error: "Acesso restrito." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return Response.json({ error: "Dados inválidos." }, { status: 400 });

  const clientId = typeof body.veopagClientId === "string" ? body.veopagClientId.trim() : "";
  const callbackUrl = typeof body.veopagCallbackUrl === "string" ? body.veopagCallbackUrl.trim() : "";
  const clientSecret = typeof body.veopagClientSecret === "string" ? body.veopagClientSecret.trim() : "";
  const webhookSecret = typeof body.veopagWebhookSecret === "string" ? body.veopagWebhookSecret.trim() : "";
  const clearClientSecret = body.clearClientSecret === true;
  const clearWebhookSecret = body.clearWebhookSecret === true;

  await prisma.gatewaySettings.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      veopagClientId: clientId || null,
      veopagCallbackUrl: callbackUrl || null,
      veopagClientSecret: clientSecret || null,
      veopagWebhookSecret: webhookSecret || null,
    },
    update: {
      veopagClientId: clientId || null,
      veopagCallbackUrl: callbackUrl || null,
      // Campos de senha: só sobrescreve se algo foi digitado, ou se pediram para remover explicitamente.
      ...(clientSecret ? { veopagClientSecret: clientSecret } : clearClientSecret ? { veopagClientSecret: null } : {}),
      ...(webhookSecret ? { veopagWebhookSecret: webhookSecret } : clearWebhookSecret ? { veopagWebhookSecret: null } : {}),
    },
  });

  invalidateTokenCache();

  return Response.json({ ok: true });
}
