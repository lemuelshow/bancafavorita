import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const EMAIL = "jogador@bancafavorita.local";
const PHONE = "83999990000";
const CPF = "52998224725";
const SENHA = "Jogador123!";

const existing = await prisma.user.findUnique({ where: { email: EMAIL } });
if (existing) {
  console.log("Jogador demo já existe:", EMAIL);
} else {
  const passwordHash = await bcrypt.hash(SENHA, 10);
  const user = await prisma.user.create({
    data: {
      name: "Jogador Demo",
      email: EMAIL,
      phone: PHONE,
      cpf: CPF,
      passwordHash,
      isAdmin: false,
      balance: 500,
    },
  });
  await prisma.transaction.create({
    data: { userId: user.id, kind: "DEPOSITO_SIMULADO", amount: 500, description: "Bônus de boas-vindas" },
  });
  console.log("Jogador demo criado:", EMAIL, "/ celular:", PHONE, "/ senha:", SENHA);
}

await prisma.$disconnect();
