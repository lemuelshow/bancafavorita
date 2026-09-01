import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const EMAIL = "admin@bancafavorita.local";
const SENHA = "BFadmin123!";

const existing = await prisma.user.findUnique({ where: { email: EMAIL } });
if (existing) {
  console.log("Admin já existe:", EMAIL);
} else {
  const passwordHash = await bcrypt.hash(SENHA, 10);
  await prisma.user.create({
    data: {
      name: "Administrador",
      email: EMAIL,
      phone: "00000000000",
      cpf: "00000000000",
      passwordHash,
      isAdmin: true,
      balance: 0,
    },
  });
  console.log("Admin criado:", EMAIL, "/ senha:", SENHA);
}

await prisma.$disconnect();
