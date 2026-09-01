import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { generateReferralCode } from "@/lib/affiliates";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
  } catch {
    return Response.json({ error: "Acesso restrito." }, { status: 403 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return Response.json({ error: "Usuário não encontrado." }, { status: 404 });

  if (user.isAffiliate) {
    const updated = await prisma.user.update({ where: { id }, data: { isAffiliate: false } });
    return Response.json({ isAffiliate: updated.isAffiliate });
  }

  let referralCode = user.referralCode;
  if (!referralCode) {
    for (let i = 0; i < 5; i++) {
      const candidate = generateReferralCode();
      const clash = await prisma.user.findUnique({ where: { referralCode: candidate } });
      if (!clash) {
        referralCode = candidate;
        break;
      }
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isAffiliate: true, referralCode },
  });

  return Response.json({ isAffiliate: updated.isAffiliate, referralCode: updated.referralCode });
}
