import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  let user;
  try {
    user = await requireUser(request);
  } catch {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  const [fresh, extrato] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: user.id } }),
    prisma.transaction.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);

  return Response.json({ balance: Number(fresh.balance), extrato });
}

// Depósito/saque simulados (sem gateway real) — usados apenas para fins de teste/demo.
// Limitados a um teto baixo e nunca expostos como forma de crédito real de saldo.
const MAX_SIMULATED_AMOUNT = 500;

export async function POST(request: Request) {
  let user;
  try {
    user = await requireUser(request);
  } catch {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const kind = body?.kind === "saque" ? "SAQUE_SIMULADO" : body?.kind === "deposito" ? "DEPOSITO_SIMULADO" : null;
  const amount = Number(body?.amount);

  if (!kind || !Number.isFinite(amount) || !(amount > 0) || amount > MAX_SIMULATED_AMOUNT) {
    return Response.json(
      { error: `Informe um valor entre 0,01 e ${MAX_SIMULATED_AMOUNT}.` },
      { status: 400 }
    );
  }

  const signedAmount = kind === "SAQUE_SIMULADO" ? -amount : amount;
  const description = kind === "SAQUE_SIMULADO" ? "Saque simulado" : "Depósito simulado";

  if (kind === "SAQUE_SIMULADO") {
    // updateMany com filtro de saldo garante atomicidade: duas requisições concorrentes não
    // conseguem, juntas, sacar mais do que o saldo disponível (evita corrida/saldo negativo).
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.user.updateMany({
        where: { id: user.id, balance: { gte: amount } },
        data: { balance: { decrement: amount } },
      });
      if (result.count === 0) return null;
      await tx.transaction.create({ data: { userId: user.id, kind, amount: signedAmount, description } });
      return result;
    });

    if (!updated) {
      return Response.json({ error: "Saldo insuficiente para saque." }, { status: 422 });
    }
  } else {
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { balance: { increment: signedAmount } } }),
      prisma.transaction.create({ data: { userId: user.id, kind, amount: signedAmount, description } }),
    ]);
  }

  const fresh = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  return Response.json({ balance: Number(fresh.balance) });
}
