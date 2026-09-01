import { Prisma } from "@prisma/client";
import { hashPassword, issueToken, toPublicUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isValidCpf, isValidPhone, onlyDigits } from "@/lib/cpf";
import { creditCpaForReferral } from "@/lib/affiliates";
import { attributeCambista } from "@/lib/cambistas";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!rateLimit(`register:${clientIp(request)}`, 5, 60_000)) {
    return Response.json({ error: "Muitas tentativas. Tente novamente em instantes." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const emailRaw = typeof body?.email === "string" ? body.email.trim() : "";
  const phone = typeof body?.phone === "string" ? onlyDigits(body.phone) : "";
  const cpf = typeof body?.cpf === "string" ? onlyDigits(body.cpf) : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!name) return Response.json({ error: "Informe seu nome." }, { status: 400 });
  if (!isValidPhone(phone)) return Response.json({ error: "Celular inválido." }, { status: 400 });
  if (!isValidCpf(cpf)) return Response.json({ error: "CPF inválido." }, { status: 400 });
  if (password.length < 8) return Response.json({ error: "A senha deve ter pelo menos 8 caracteres." }, { status: 400 });
  if (emailRaw && !/^\S+@\S+\.\S+$/.test(emailRaw)) {
    return Response.json({ error: "E-mail inválido." }, { status: 400 });
  }

  const email = emailRaw ? emailRaw.toLowerCase() : null;

  const [existingPhone, existingCpf, existingEmail] = await Promise.all([
    prisma.user.findUnique({ where: { phone } }),
    prisma.user.findUnique({ where: { cpf } }),
    email ? prisma.user.findUnique({ where: { email } }) : null,
  ]);
  if (existingPhone) return Response.json({ error: "Este celular já está cadastrado." }, { status: 409 });
  if (existingCpf) return Response.json({ error: "Este CPF já está cadastrado." }, { status: 409 });
  if (existingEmail) return Response.json({ error: "Este e-mail já está cadastrado." }, { status: 409 });

  const referralCode = typeof body?.ref === "string" ? body.ref.trim().toUpperCase() : "";
  const cambistaCode = typeof body?.cambista === "string" ? body.cambista.trim().toUpperCase() : "";

  const passwordHash = await hashPassword(password);

  let user;
  try {
    user = await prisma.user.create({
      data: { name, email, phone, cpf, passwordHash, balance: 500 },
    });
  } catch (error) {
    // Corrida entre a checagem acima e o create: outra requisição cadastrou o mesmo
    // celular/CPF/e-mail nesse meio-tempo e a constraint única do banco pegou o caso.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json({ error: "Celular, CPF ou e-mail já cadastrado." }, { status: 409 });
    }
    throw error;
  }

  await prisma.transaction.create({
    data: { userId: user.id, kind: "DEPOSITO_SIMULADO", amount: 500, description: "Bônus de boas-vindas" },
  });

  if (referralCode) {
    await creditCpaForReferral(referralCode, user.id).catch(() => {});
  }
  if (cambistaCode) {
    await attributeCambista(cambistaCode, user.id).catch(() => {});
  }

  const token = issueToken(user);

  return Response.json({ token, user: toPublicUser(user) }, { status: 201 });
}
