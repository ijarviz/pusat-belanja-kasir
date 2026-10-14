import "server-only"

import { cookies } from "next/headers"

import { queryOne } from "@/lib/db"
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  signSessionToken,
  verifySessionToken,
} from "@/lib/session-token"

export type SessionUser = {
  id: string
  email: string
  name: string | null
}

export async function createSession(userId: string) {
  const token = await signSessionToken({ userId })
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

/*
 * User yang sedang login, atau null. Selalu dicek ulang ke tabel
 * users supaya akun yang sudah dihapus langsung kehilangan akses.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const session = await verifySessionToken(
    cookieStore.get(SESSION_COOKIE)?.value
  )

  if (!session) return null

  return queryOne<SessionUser>(
    "SELECT id, email, name FROM users WHERE id = ?",
    [session.userId]
  )
}
