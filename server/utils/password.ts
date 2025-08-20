export function isBcryptHash(value: string | undefined | null): boolean {
  if (!value) return false
  
  return /^\$2[aby]\$\d{2}\$[A-Za-z0-9./]{53}$/.test(value)
}