import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 20;
const VALID_KINDS = ["DEPOSITO_PIX", "DEPOSITO_SIMULADO", "SAQUE_SIMULADO", "APOSTA", "PREMIO"];

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
  } catch {
    return Response.json({ error: "Acesso restrito." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const kind = searchParams.get("kind");

  const where: Prisma.TransactionWhereInput =
    kind && VALID_KINDS.includes(kind) ? { kind: kind as Prisma.TransactionWhereInput["kind"] } : {};

  const [transacoes, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { user: { select: { name: true, email: true, phone: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.transaction.count({ where }),
  ]);

  return Response.json({ transacoes, total, page, pageSize: PAGE_SIZE });
}
