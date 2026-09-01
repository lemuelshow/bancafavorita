import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  let user;
  try {
    user = await requireUser(request);
  } catch {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  const full = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!full.isAffiliate) {
    return Response.json({ error: "Você ainda não é afiliado." }, { status: 403 });
  }

  const [referralCount, earnings] = await Promise.all([
    prisma.user.count({ where: { referredById: user.id } }),
    prisma.affiliateEarning.findMany({
      where: { affiliateId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const cpaTotal = earnings.filter((e) => e.kind === "CPA").reduce((s, e) => s + Number(e.amount), 0);
  const revTotal = earnings.filter((e) => e.kind === "REV").reduce((s, e) => s + Number(e.amount), 0);

  return Response.json({
    referralCode: full.referralCode,
    affiliateCpa: Number(full.affiliateCpa),
    affiliateRevPct: Number(full.affiliateRevPct),
    referralCount,
    cpaTotal,
    revTotal,
    total: cpaTotal + revTotal,
    earnings,
  });
}
