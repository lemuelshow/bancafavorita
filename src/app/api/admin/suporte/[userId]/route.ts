import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    await requireAdmin(request);
  } catch {
    return Response.json({ error: "Acesso restrito." }, { status: 403 });
  }

  const { userId } = await params;
  const [cliente, mensagens] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, phone: true } }),
    prisma.supportMessage.findMany({ where: { userId }, orderBy: { createdAt: "asc" }, take: 200 }),
  ]);

  if (!cliente) return Response.json({ error: "Cliente não encontrado." }, { status: 404 });

  return Response.json({ cliente, mensagens });
}

export async function POST(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    await requireAdmin(request);
  } catch {
    return Response.json({ error: "Acesso restrito." }, { status: 403 });
  }

  const { userId } = await params;
  const body = await request.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message) return Response.json({ error: "Digite uma mensagem." }, { status: 400 });
  if (message.length > 2000) return Response.json({ error: "Mensagem muito longa." }, { status: 400 });

  const cliente = await prisma.user.findUnique({ where: { id: userId } });
  if (!cliente) return Response.json({ error: "Cliente não encontrado." }, { status: 404 });

  const mensagem = await prisma.supportMessage.create({
    data: { userId, sender: "equipe", message },
  });

  return Response.json({ mensagem }, { status: 201 });
}
