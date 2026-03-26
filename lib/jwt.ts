import { jwtVerify, SignJWT } from "jose";

const JWT_ALGORITHM = "HS256";
const DEFAULT_JWT_SECRET = "dev-test-secret-change-me";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET ?? DEFAULT_JWT_SECRET;
  return new TextEncoder().encode(secret);
}

export type AuthTokenPayload = {
  sub: string;
  username: string;
};

export async function signAuthToken(payload: AuthTokenPayload) {
  return new SignJWT({ username: payload.username })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifyAuthToken(token: string) {
  const { payload } = await jwtVerify(token, getJwtSecret(), {
    algorithms: [JWT_ALGORITHM],
  });

  const userId = typeof payload.sub === "string" ? payload.sub : null;
  const username = typeof payload.username === "string" ? payload.username : null;

  if (!userId || !username) {
    throw new Error("Token invalide.");
  }

  return {
    userId,
    username,
  };
}
