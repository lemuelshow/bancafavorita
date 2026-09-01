import "server-only";
import crypto from "node:crypto";
import { prisma } from "./db";

const BASE_URL = "https://api.veopag.com";

type GatewayConfig = {
  clientId: string | null;
  clientSecret: string | null;
  webhookSecret: string | null;
  callbackUrl: string | null;
};

/** Credenciais configuradas pelo admin (aba Gateway) têm prioridade; env vars são fallback de deploy. */
async function getConfig(): Promise<GatewayConfig> {
  const s = await prisma.gatewaySettings.findUnique({ where: { id: "singleton" } });
  return {
    clientId: s?.veopagClientId || process.env.VEOPAG_CLIENT_ID || null,
    clientSecret: s?.veopagClientSecret || process.env.VEOPAG_CLIENT_SECRET || null,
    webhookSecret: s?.veopagWebhookSecret || process.env.VEOPAG_WEBHOOK_SECRET || null,
    callbackUrl: s?.veopagCallbackUrl || process.env.VEOPAG_CALLBACK_URL || null,
  };
}

let cachedToken: { token: string; expiresAt: number } | null = null;

/** Chamado pela rota admin ao salvar novas credenciais, para não seguir usando um token antigo. */
export function invalidateTokenCache(): void {
  cachedToken = null;
}

async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token;

  const { clientId, clientSecret } = await getConfig();
  if (!clientId || !clientSecret) {
    throw new Error("Gateway de pagamento não configurado. Preencha as credenciais em Admin → Gateway.");
  }

  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
  });
  if (!res.ok) throw new Error(`Falha ao autenticar no gateway de pagamento (${res.status}).`);
  const data = await res.json();
  if (!data?.token) throw new Error("Resposta inválida do gateway de pagamento ao autenticar.");

  // Cacheia por ~55min (token dura 1h) para evitar login a cada chamada.
  cachedToken = { token: data.token, expiresAt: Date.now() + 55 * 60 * 1000 };
  return data.token;
}

type PixPayer = { name: string; email: string; document: string };

export type PixDepositCreated = {
  transactionId: string;
  status: string;
  qrcode: string;
  amount: number;
  fee?: number;
};

export async function createPixDeposit(params: {
  amount: number;
  externalId: string;
  payer: PixPayer;
  callbackUrl?: string;
}): Promise<PixDepositCreated> {
  const token = await getToken();
  const config = await getConfig();
  const callbackUrl = params.callbackUrl ?? config.callbackUrl ?? undefined;

  const res = await fetch(`${BASE_URL}/api/payments/deposit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      amount: params.amount,
      external_id: params.externalId,
      payer: params.payer,
      ...(callbackUrl ? { clientCallbackUrl: callbackUrl } : {}),
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.qrCodeResponse) {
    throw new Error(data?.message ?? `Falha ao gerar cobrança Pix (${res.status}).`);
  }

  const q = data.qrCodeResponse;
  return { transactionId: q.transactionId, status: q.status, qrcode: q.qrcode, amount: Number(q.amount), fee: q.fee != null ? Number(q.fee) : undefined };
}

export type PixDepositStatusResult = {
  status: "COMPLETED" | "PENDING" | "FAILED";
  amount: number;
  fee: number | null;
  transactionId: string;
} | null;

export async function getPixDepositStatus(externalId: string): Promise<PixDepositStatusResult> {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/api/transactions/deposit?external_id=${encodeURIComponent(externalId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Falha ao consultar cobrança Pix (${res.status}).`);
  const data = await res.json();
  if (!data?.deposit) return null;

  return {
    status: data.deposit.status,
    amount: Number(data.deposit.amount),
    fee: data.deposit.fee != null ? Number(data.deposit.fee) : null,
    transactionId: data.deposit.transaction_id,
  };
}

const WEBHOOK_MAX_AGE_MS = 5 * 60 * 1000;

/** Verifica a assinatura HMAC-SHA256 do webhook VeoPag: hex(HMAC(secret, `${timestamp}.${rawBody}`)). */
export async function verifyWebhookSignature(rawBody: string, timestamp: string, signature: string): Promise<boolean> {
  const { webhookSecret: secret } = await getConfig();
  if (!secret || !timestamp || !signature) return false;

  // Timestamp pode vir como epoch (segundos ou ms) ou ISO 8601 — aceitamos ambos os formatos.
  let tsMs = Number(timestamp);
  if (!Number.isFinite(tsMs)) tsMs = Date.parse(timestamp);
  else if (tsMs < 1e12) tsMs *= 1000; // epoch em segundos
  if (!Number.isFinite(tsMs) || Math.abs(Date.now() - tsMs) > WEBHOOK_MAX_AGE_MS) return false;

  const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
