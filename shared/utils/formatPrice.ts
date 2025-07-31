import { formatCommas } from './formatCommas'

export function formatPrice(num: number = 0): string {
  const commaNumber = formatCommas(num)

  return commaNumber ? `$${commaNumber}` : ''
}