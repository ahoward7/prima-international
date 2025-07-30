export function getNestedValue(machine: any, path: string): string | number {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null
  }, machine) || 'NONE'
}