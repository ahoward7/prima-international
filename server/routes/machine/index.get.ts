import type { H3Event } from 'h3'
import l from 'lodash'
import machines from '~/temp/machines.json'

interface DBMachineCamelCase extends Omit<Machine, 'contact'> {
  contactId: number
}

export default defineEventHandler(async (event: H3Event): Promise<Machine[]> => {
  const snakeCaseMachines: DBMachine[] = machines

  const camelCaseMachines: DBMachineCamelCase[] = snakeCaseMachines.map(machine => {
    return Object.fromEntries(
      Object.entries(machine).map(([key, value]) => [l.camelCase(key), value])
    ) as DBMachineCamelCase
  })

  const finalMachines: Machine[] = camelCaseMachines.map(machine => {
    return Object.fromEntries(
      Object.entries(machine).map(([key, value]) => [key.endsWith('Id') ? key.slice(0, -2) : key, key.includes('contact') ? { id: value, company: 'Company', name: 'Name'} : value])
    ) as Machine
  })

  return finalMachines
})
