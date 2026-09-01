import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const EMAIL = "cambista@bancafavorita.local";
const PHONE = "83999991111";
const CPF = "87432598045";
const SENHA = "Cambista123!";
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCambistaCode() {
  let code = "";
  for (let i = 0; i < 8; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return code;
}

const existing = await prisma.user.findUnique({ where: { email: EMAIL } });
if (existing) {
  console.log("Cambista demo já existe:", EMAIL, "/ código:", existing.cambistaCode);
} else {
  const passwordHash = await bcrypt.hash(SENHA, 10);
  const user = await prisma.user.create({
    data: {
      name: "Cambista Demo",
      email: EMAIL,
      phone: PHONE,
      cpf: CPF,
      passwordHash,
      isAdmin: false,
      isCambista: true,
      cambistaCommissionPct: 10,
      cambistaCode: generateCambistaCode(),
      balance: 0,
    },
  });
  console.log("Cambista demo criado:", EMAIL, "/ celular:", PHONE, "/ senha:", SENHA, "/ código:", user.cambistaCode);
}

await prisma.$disconnect();
