import { userFromRequest } from "@/lib/auth-server";

export async function GET(request: Request) {
  const user = await userFromRequest(request);
  if (!user) return Response.json({ error: "Não autenticado." }, { status: 401 });
  return Response.json({ user });
}
