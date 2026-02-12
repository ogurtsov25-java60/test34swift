import crypto from "node:crypto";

export function userIdFromAppleIdToken(idToken: string) {
  const hash = crypto.createHash("sha256").update(idToken).digest("hex").slice(0, 32);
  return `apple_${hash}`;
}

export function newAuthToken(_userId?: string) {
  return crypto.randomUUID();
}
