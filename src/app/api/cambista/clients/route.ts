import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { onlyDigits } from "@/lib/cpf";

export async function GET(request: Request) {
  let user;
  try {
    user = await requireUser(request);
  } catch {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }
  if (!user.isCambista) return Response.json({ error: "Você ainda não é cambista." }, { status: 403 });

  const clients = await prisma.cambistaClient.findMany({
    where: { cambistaId: user.id },
    orderBy: { name: "asc" },
  });

  return Response.json({ clients });
}

export async function POST(request: Request) {
  let user;
  try {
    user = await requireUser(request);
  } catch {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }
  if (!user.isCambista) return Response.json({ error: "Você ainda não é cambista." }, { status: 403 });

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const phone = typeof body?.phone === "string" ? onlyDigits(body.phone) : "";
  const address = typeof body?.address === "string" ? body.address.trim() : "";

  if (!name) return Response.json({ error: "Informe o nome do cliente." }, { status: 400 });
  if (phone.length < 10) return Response.json({ error: "Telefone inválido." }, { status: 400 });

  const client = await prisma.cambistaClient.create({
    data: { cambistaId: user.id, name, phone, address: address || null },
  });

  return Response.json({ client }, { status: 201 });
}
