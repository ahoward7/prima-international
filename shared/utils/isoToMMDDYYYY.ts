export function isoToMMDDYYYY(isoString: string = ''): string {
  if (!isoString) {
    return ''
  }

  const date = new Date(isoString)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = (date.getDate() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${month}/${day}/${year}`
}