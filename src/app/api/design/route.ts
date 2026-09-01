import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });

  return Response.json({
    logoUrl: settings?.logoUrl ?? null,
    loginImageUrl: settings?.loginImageUrl ?? null,
    registerImageUrl: settings?.registerImageUrl ?? null,
    banner1Url: settings?.banner1Url ?? null,
    banner2Url: settings?.banner2Url ?? null,
    banner3Url: settings?.banner3Url ?? null,
    promo1Url: settings?.promo1Url ?? null,
    promo2Url: settings?.promo2Url ?? null,
    promo3Url: settings?.promo3Url ?? null,
    supportChatUrl: settings?.supportChatUrl ?? null,
  });
}
