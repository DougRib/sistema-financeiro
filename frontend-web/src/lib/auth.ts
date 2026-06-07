import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// garante que JWT_SECRET seja sempre uma string
const JWT_SECRET = process.env.JWT_SECRET ?? "";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET não definido. Configure a variável de ambiente JWT_SECRET.");
}

// assina um access-token curto (1h por padrão).
// O refresh-token (7d) é manejado em src/lib/sessions.ts.
export function signJwt(payload: object, expiresIn: string | number = "1h") {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

// verifica se o token é válido
export function verifyJwt<T>(token: string): T | null {
  try {
    return jwt.verify(token, JWT_SECRET) as T;
  } catch {
    return null;
  }
}

// criptografa uma senha
export async function hashPassword(pw: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pw, salt);
}

// compara uma senha com o hash
export async function comparePassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}
