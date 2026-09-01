import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { reconcilePixDeposit } from "@/lib/pix";

// Consulta local + fallback de reconciliação: se o depósito ainda está PENDING e já
// tem alguns segundos, consultamos o gateway diretamente (cobre falha/atraso de webhook).
const RECONCILE_AFTER_MS = 4000;

export async function GET(request: Request, { params }: { params: Promise<{ externalId: string }> }) {
  let user;
  try {
    user = await requireUser(request);
  } catch {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { externalId } = await params;
  let deposit = await prisma.pixDeposit.findUnique({ where: { externalId } });
  if (!deposit || deposit.userId !== user.id) {
    return Response.json({ error: "Depósito não encontrado." }, { status: 404 });
  }

  if (deposit.status === "PENDING" && Date.now() - deposit.createdAt.getTime() > RECONCILE_AFTER_MS) {
    try {
      deposit = (await reconcilePixDeposit(externalId)) ?? deposit;
    } catch {
      // mantém PENDING — o cliente tenta de novo no próximo poll
    }
  }

  return Response.json({ status: deposit.status, amount: Number(deposit.amount) });
}
