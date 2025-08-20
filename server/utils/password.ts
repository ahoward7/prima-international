import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

export function isBcryptHash(value: string | undefined | null): boolean {
  if (!value) return false
  
  return /^\$2[aby]\$\d{2}\$[A-Za-z0-9./]{53}$/.test(value)
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  if (isBcryptHash(stored)) {
    return bcrypt.compare(plain, stored)
  }

  return plain === stored
}
