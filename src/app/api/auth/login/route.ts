import { issueToken, toPublicUser, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { onlyDigits } from "@/lib/cpf";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// Hash "dummy" só para gastar o mesmo tempo de bcrypt.compare quando o usuário não existe,
// evitando que o tempo de resposta revele se um e-mail/celular está cadastrado.
const DUMMY_HASH = "$2b$10$CwTycUXWue0Thq9StjUM0uJ8jH0.YU8DLKA4/9uLzP7wYzYWm2p1S";

export async function POST(request: Request) {
  if (!rateLimit(`login:${clientIp(request)}`, 10, 60_000)) {
    return Response.json({ error: "Muitas tentativas. Tente novamente em instantes." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const login = typeof body?.login === "string" ? body.login.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!login || !password) {
    return Response.json({ error: "Informe e-mail/celular e senha." }, { status: 400 });
  }

  const isEmail = login.includes("@");
  const user = isEmail
    ? await prisma.user.findUnique({ where: { email: login.toLowerCase() } })
    : await prisma.user.findUnique({ where: { phone: onlyDigits(login) } });

  const passwordOk = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !passwordOk) {
    return Response.json({ error: "E-mail/celular ou senha inválidos." }, { status: 401 });
  }
  if (user.bannedAt) {
    return Response.json({ error: "Sua conta foi banida. Entre em contato com o suporte." }, { status: 403 });
  }

  const token = issueToken(user);

  return Response.json({ token, user: toPublicUser(user) });
}
