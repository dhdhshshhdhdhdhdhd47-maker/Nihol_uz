import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "NiholErp_Secure_2026_K3y!@#$%RandomString";
const JWT_EXPIRES_IN_SECONDS = 60 * 60 * 24; // 24 soat

// ─── bcrypt-like password hashing using PBKDF2 (native Node.js, no dependency) ───
const HASH_ITERATIONS = 100_000;
const HASH_KEYLEN = 64;
const HASH_DIGEST = "sha512";
const SALT_BYTES = 32;

export function hashPassword(plainText: string): string {
  const salt = crypto.randomBytes(SALT_BYTES).toString("hex");
  const hash = crypto
    .pbkdf2Sync(plainText, salt, HASH_ITERATIONS, HASH_KEYLEN, HASH_DIGEST)
    .toString("hex");
  return `pbkdf2:${HASH_ITERATIONS}:${salt}:${hash}`;
}

export function verifyPassword(plainText: string, stored: string): boolean {
  try {
    // Support legacy plain-text passwords for migration (first login will auto-upgrade)
    if (!stored.startsWith("pbkdf2:")) {
      return plainText === stored;
    }
    const [, iterStr, salt, storedHash] = stored.split(":");
    const iters = parseInt(iterStr, 10);
    const hash = crypto
      .pbkdf2Sync(plainText, salt, iters, HASH_KEYLEN, HASH_DIGEST)
      .toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
  } catch {
    return false;
  }
}

// ─── JWT ───
export function signToken(payload: any): string {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { ...payload, iat: now, exp: now + JWT_EXPIRES_IN_SECONDS };
  const header = { alg: "HS256", typ: "JWT" };
  const sHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const sPayload = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${sHeader}.${sPayload}`)
    .digest("base64url");
  return `${sHeader}.${sPayload}.${signature}`;
}

export function verifyToken(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [sHeader, sPayload, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${sHeader}.${sPayload}`)
      .digest("base64url");
    if (signature !== expectedSignature) return null;
    const payload = JSON.parse(Buffer.from(sPayload, "base64url").toString("utf-8"));
    // Check expiration
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      console.warn("[Auth] JWT token muddati tugagan (expired).");
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

// ─── Express Auth Middleware ───
export function authMiddleware(allowedRoles?: string[]) {
  return (req: any, res: any, next: any) => {
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Avtorizatsiya tokeni mavjud emas! Iltimos, tizimga kiring."
      });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ success: false, message: "JWT token yaroqsiz yoki muddati tugagan! Qayta kiring." });
    }

    req.user = decoded;

    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(decoded.role)) {
        return res.status(403).json({
          success: false,
          message: `Ruxsat etilmadi: Sizning lavozimingiz (${decoded.role}) ushbu amalni bajarish uchun yetarli emas.`
        });
      }
    }

    next();
  };
}
