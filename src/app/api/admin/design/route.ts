import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

const MAX_DATA_URL_LENGTH = 8_000_000; // ~6MB de imagem original em base64
const FIELDS = [
  "logoUrl",
  "loginImageUrl",
  "registerImageUrl",
  "banner1Url",
  "banner2Url",
  "banner3Url",
  "promo1Url",
  "promo2Url",
  "promo3Url",
] as const;
type Field = (typeof FIELDS)[number];

function isValidValue(value: unknown): value is string | null {
  if (value === null) return true;
  return typeof value === "string" && value.startsWith("data:image/") && value.length <= MAX_DATA_URL_LENGTH;
}

function isValidUrl(value: unknown): value is string | null {
  if (value === null) return true;
  if (typeof value !== "string") return false;
  if (value.length === 0) return true;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
  } catch {
    return Response.json({ error: "Acesso restrito." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const data: Partial<Record<Field, string | null>> & { supportChatUrl?: string | null } = {};
  for (const field of FIELDS) {
    if (field in body) {
      if (!isValidValue(body[field])) {
        return Response.json({ error: `Imagem inválida ou muito grande em "${field}".` }, { status: 400 });
      }
      data[field] = body[field];
    }
  }
  if ("supportChatUrl" in body) {
    if (!isValidUrl(body.supportChatUrl)) {
      return Response.json({ error: "URL do chat de suporte inválida." }, { status: 400 });
    }
    data.supportChatUrl = body.supportChatUrl || null;
  }

  if (Object.keys(data).length === 0) {
    return Response.json({ error: "Nada para atualizar." }, { status: 400 });
  }

  const settings = await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });

  return Response.json({
    logoUrl: settings.logoUrl,
    loginImageUrl: settings.loginImageUrl,
    registerImageUrl: settings.registerImageUrl,
    banner1Url: settings.banner1Url,
    banner2Url: settings.banner2Url,
    banner3Url: settings.banner3Url,
    promo1Url: settings.promo1Url,
    promo2Url: settings.promo2Url,
    promo3Url: settings.promo3Url,
    supportChatUrl: settings.supportChatUrl,
  });
}
