import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  let user;
  try {
    user = await requireUser(request);
  } catch {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  const mensagens = await prisma.supportMessage.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  return Response.json({ mensagens });
}

export async function POST(request: Request) {
  let user;
  try {
    user = await requireUser(request);
  } catch {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message) return Response.json({ error: "Digite uma mensagem." }, { status: 400 });
  if (message.length > 2000) return Response.json({ error: "Mensagem muito longa." }, { status: 400 });

  const mensagem = await prisma.supportMessage.create({
    data: { userId: user.id, sender: "cliente", message },
  });

  return Response.json({ mensagem }, { status: 201 });
}
