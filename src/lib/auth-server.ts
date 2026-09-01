import "server-only";
import { prisma } from "./db";
import { toPublicUser } from "./auth";
import { verifyToken } from "./jwt";
import type { PublicUser } from "./types";

export class AuthError extends Error {}

export function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export async function userFromRequest(request: Request): Promise<PublicUser | null> {
  const token = getBearerToken(request);
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.bannedAt) return null;
  return toPublicUser(user);
}

export async function requireUser(request: Request): Promise<PublicUser> {
  const user = await userFromRequest(request);
  if (!user) throw new AuthError("Não autenticado.");
  return user;
}

export async function requireAdmin(request: Request): Promise<PublicUser> {
  const user = await requireUser(request);
  if (!user.isAdmin) throw new AuthError("Acesso restrito.");
  return user;
}
