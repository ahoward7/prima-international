export function formatNumber(value: number | undefined): string {
  return value?.toLocaleString('en-US') ?? ''
}

export function unformatNumber(str: string): number | undefined {
  const cleaned = str.replace(/,/g, '')
  return cleaned === '' || Number.isNaN(Number(cleaned)) ? undefined : Number(cleaned)
}
