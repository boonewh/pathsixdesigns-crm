export type TokenClaims = {
  sub: number;
  email: string;
  roles: string[];
  exp: number;
  tenant_id?: number;
};

/** Decode display/expiry claims only. The backend still verifies authorization. */
export function readTokenClaims(token: string): TokenClaims {
  const parts = token.split(".");
  if (parts.length !== 3 || parts.some(part => !part) || !/^[A-Za-z0-9_-]+$/.test(parts[1])) {
    throw new Error("Invalid token payload");
  }
  const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const bytes = Uint8Array.from(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")), c => c.charCodeAt(0));
  const payload: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Invalid token claims");
  const claims = payload as Record<string, unknown>;
  const subject = typeof claims.sub === "number" || (typeof claims.sub === "string" && /^\d+$/.test(claims.sub))
    ? Number(claims.sub) : NaN;
  if (!Number.isSafeInteger(subject) || subject < 1 || typeof claims.email !== "string" ||
      !Array.isArray(claims.roles) || !claims.roles.every(role => typeof role === "string") ||
      typeof claims.exp !== "number" || !Number.isFinite(claims.exp)) {
    throw new Error("Invalid token claims");
  }
  return { sub: subject, email: claims.email, roles: claims.roles, exp: claims.exp,
    ...(typeof claims.tenant_id === "number" ? { tenant_id: claims.tenant_id } : {}) };
}
