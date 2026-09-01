import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
  } catch {
    return Response.json({ error: "Acesso restrito." }, { status: 403 });
  }

  const affiliates = await prisma.user.findMany({
    where: { isAffiliate: true },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      affiliateCpa: true,
      affiliateRevPct: true,
      referralCode: true,
      _count: { select: { referrals: true } },
    },
    orderBy: { name: "asc" },
  });

  const sums = affiliates.length
    ? await prisma.affiliateEarning.groupBy({
        by: ["affiliateId", "kind"],
        where: { affiliateId: { in: affiliates.map((a) => a.id) } },
        _sum: { amount: true },
      })
    : [];

  const result = affiliates.map((a) => {
    const cpaTotal = sums.find((s) => s.affiliateId === a.id && s.kind === "CPA")?._sum.amount ?? 0;
    const revTotal = sums.find((s) => s.affiliateId === a.id && s.kind === "REV")?._sum.amount ?? 0;
    return {
      id: a.id,
      name: a.name,
      email: a.email,
      phone: a.phone,
      affiliateCpa: Number(a.affiliateCpa),
      affiliateRevPct: Number(a.affiliateRevPct),
      referralCode: a.referralCode,
      referralCount: a._count.referrals,
      cpaTotal: Number(cpaTotal),
      revTotal: Number(revTotal),
    };
  });

  return Response.json({ affiliates: result });
}
