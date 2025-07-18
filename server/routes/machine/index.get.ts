import type { H3Event } from 'h3'
import l from 'lodash'
import jsonMachines from '~/temp/machines.json'

interface DBMachineCamelCase extends Omit<Machine, 'contact'> {
  contactId: number
}

function convertToFrontEnd(dbMachines: DBMachine[]) {
  const camelCaseMachines: DBMachineCamelCase[] = dbMachines.map(machine => {
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
}

function universalSearch(machines: Machine[], searchTerm: string): Machine[] {
  if (!searchTerm || searchTerm.trim() === '') {
    return machines
  }

  const normalizedSearch = searchTerm.toLowerCase().trim()
  
  return machines.filter(machine => {
    // Helper function to recursively search through nested objects
    const searchInValue = (value: any): boolean => {
      if (value === null || value === undefined) {
        return false
      }
      
      if (typeof value === 'string') {
        return value.toLowerCase().includes(normalizedSearch)
      }
      
      if (typeof value === 'number') {
        return value.toString().includes(normalizedSearch)
      }
      
      if (typeof value === 'boolean') {
        return value.toString().toLowerCase().includes(normalizedSearch)
      }
      
      if (Array.isArray(value)) {
        return value.some(item => searchInValue(item))
      }
      
      if (typeof value === 'object') {
        return Object.values(value).some(nestedValue => searchInValue(nestedValue))
      }
      
      return false
    }

    // Search through all values in the machine object
    return Object.values(machine).some(value => searchInValue(value))
  })
}

export default defineEventHandler(async (event: H3Event): Promise<Machine[]> => {
  const machines = convertToFrontEnd(jsonMachines)
  const { category, search, pageSize } = getQuery(event)
  
  let filteredMachines = machines

  // Apply universal search if search term exists
  if (search && typeof search === 'string') {
    filteredMachines = universalSearch(filteredMachines, search)
  }

  // You can add category filtering here if needed
  // if (category && typeof category === 'string') {
  //   filteredMachines = filteredMachines.filter(machine => 
  //     machine.category?.toLowerCase() === category.toLowerCase()
  //   )
  // }

  return l.take(filteredMachines, pageSize || 20)
})