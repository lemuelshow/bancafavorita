import "server-only";
import jwt from "jsonwebtoken";

export type AuthTokenPayload = { sub: string; isAdmin: boolean };

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET não configurado no .env");
  return secret;
}

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: "30d" });
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getSecret());
    if (typeof decoded === "string" || typeof decoded.sub !== "string" || typeof decoded.isAdmin !== "boolean") {
      return null;
    }
    return { sub: decoded.sub, isAdmin: decoded.isAdmin };
  } catch {
    return null;
  }
}
