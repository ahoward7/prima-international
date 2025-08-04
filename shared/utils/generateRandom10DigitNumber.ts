export function generateRandom10DigitNumber(): string {
  const min = 1_000_000_000
  const max = 9_999_999_999
  return (Math.floor(Math.random() * (max - min + 1)) + min).toString()
}