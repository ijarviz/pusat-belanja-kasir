import "server-only"

import bcrypt from "bcryptjs"

export const PASSWORD_MIN_LENGTH = 8

export function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}
