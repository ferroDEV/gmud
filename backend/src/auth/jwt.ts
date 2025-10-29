import jwt from "jsonwebtoken";
import { config } from "../env";

export type JwtPayload = { uid: number; username: string; role: string; name: string };

export function signJWT(payload: JwtPayload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: "8h" });
}

export function verifyJWT(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, config.jwtSecret) as any;
  } catch {
    return null;
  }
}
