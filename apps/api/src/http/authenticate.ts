import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AuthenticatedRequest extends Request {
  userId: string;
}

interface JwtPayload {
  sub: string;
}

export function authenticate(request: Request, response: Response, next: NextFunction) {
  const header = request.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    response.status(401).json({ message: "Sessao necessaria." });
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    (request as AuthenticatedRequest).userId = payload.sub;
    next();
  } catch {
    response.status(401).json({ message: "Sessao expirada. Vamos entrar novamente." });
  }
}
