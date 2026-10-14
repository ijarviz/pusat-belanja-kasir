import { jwtVerify, SignJWT } from "jose"

/*
 * Token sesi login (pengganti sesi Supabase Auth). Dipakai oleh
 * proxy.ts dan lib/session.ts, jadi modul ini tidak boleh memakai
 * next/headers.
 */

export const SESSION_COOKIE = "pb_session"

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

export type SessionPayload = {
  userId: string
}

function getSecret() {
  const secret = process.env.AUTH_SECRET

  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET belum diset (minimal 32 karakter)"
    )
  }

  return new TextEncoder().encode(secret)
}

export async function signSessionToken(
  payload: SessionPayload
) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecret())
}

export async function verifySessionToken(
  token: string | undefined
): Promise<SessionPayload | null> {
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    })

    return payload.sub ? { userId: payload.sub } : null
  } catch {
    return null
  }
}
