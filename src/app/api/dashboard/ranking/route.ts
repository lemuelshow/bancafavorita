import { requireUser } from "@/lib/auth-server";
import { getTopWinners } from "@/lib/ranking";

export async function GET(request: Request) {
  try {
    await requireUser(request);
  } catch {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  const winners = await getTopWinners(50);
  return Response.json({ winners });
}
