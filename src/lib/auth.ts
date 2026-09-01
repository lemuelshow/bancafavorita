import "server-only";
import bcrypt from "bcryptjs";
import { signToken } from "./jwt";
import type { PublicUser } from "./types";

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function issueToken(user: { id: string; isAdmin: boolean }): string {
  return signToken({ sub: user.id, isAdmin: user.isAdmin });
}

export function toPublicUser(u: {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  cpf: string;
  balance: unknown;
  isAdmin: boolean;
  isAffiliate?: boolean;
  referralCode?: string | null;
  isCambista?: boolean;
  cambistaCode?: string | null;
}): PublicUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    cpf: u.cpf,
    balance: Number(u.balance),
    isAdmin: u.isAdmin,
    isAffiliate: u.isAffiliate ?? false,
    referralCode: u.referralCode ?? null,
    isCambista: u.isCambista ?? false,
    cambistaCode: u.cambistaCode ?? null,
  };
}
