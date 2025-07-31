import l from 'lodash'

export function titleCase(str: string | number) {
  if (typeof str !== 'string') {
    return
  }

  return l.startCase(str)
}