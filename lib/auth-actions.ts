"use server"

import { execute, queryOne } from "@/lib/db"
import { verifyPassword } from "@/lib/password"
import { createSession, deleteSession } from "@/lib/session"

/*
 * Pengganti supabase.auth.* untuk aplikasi kasir: hanya login dan
 * logout. Akun dan password dikelola dari panel (halaman Akses Tim).
 */

type ActionResult =
  | { success: true }
  | { success: false; message: string }

export async function loginAction(
  email: string,
  password: string
): Promise<ActionResult> {
  const normalizedEmail = email.trim().toLowerCase()

  if (!normalizedEmail || !password) {
    return { success: false, message: "Email dan password wajib diisi" }
  }

  const user = await queryOne<{ id: string; password_hash: string }>(
    "SELECT id, password_hash FROM users WHERE email = ?",
    [normalizedEmail]
  )

  const valid = user
    ? await verifyPassword(password, user.password_hash)
    : false

  if (!user || !valid) {
    return { success: false, message: "Email atau password salah" }
  }

  await execute(
    "UPDATE users SET last_login_at = CURRENT_TIMESTAMP(6) WHERE id = ?",
    [user.id]
  )

  await createSession(user.id)

  return { success: true }
}

export async function logoutAction() {
  await deleteSession()
}
