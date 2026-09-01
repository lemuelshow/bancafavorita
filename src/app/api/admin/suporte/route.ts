import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

// Lista uma conversa por cliente (última mensagem + quando foi), mais recente primeiro.
export async function GET(request: Request) {
  try {
    await requireAdmin(request);
  } catch {
    return Response.json({ error: "Acesso restrito." }, { status: 403 });
  }

  const usuarios = await prisma.user.findMany({
    where: { supportMessages: { some: {} } },
    select: {
      id: true,
      name: true,
      phone: true,
      supportMessages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const conversas = usuarios
    .map((u) => ({
      userId: u.id,
      name: u.name,
      phone: u.phone,
      ultimaMensagem: u.supportMessages[0]?.message ?? "",
      ultimoRemetente: u.supportMessages[0]?.sender ?? "",
      atualizadoEm: u.supportMessages[0]?.createdAt ?? null,
    }))
    .sort((a, b) => (b.atualizadoEm?.getTime() ?? 0) - (a.atualizadoEm?.getTime() ?? 0));

  return Response.json({ conversas });
}
