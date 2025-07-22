import type { H3Event } from 'h3'
import l from 'lodash'
import jsonMachines from '~/tenmachines.json'

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
      Object.entries(machine).map(([key, value]) => [key.endsWith('Id') ? key.slice(0, -2) : key, key.includes('contact') ? { id: value, company: 'Company', name: 'Name' } : value])
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

function sortMachines(machines: Machine[], sortBy: string): Machine[] {
  if (!sortBy || sortBy.trim() === '') {
    return machines
  }

  const isDescending = sortBy.startsWith('-')
  const fieldName = isDescending ? sortBy.slice(1) : sortBy

  return [...machines].sort((a, b) => {
    const aValue = getNestedValue(a, fieldName)
    const bValue = getNestedValue(b, fieldName)

    // Handle falsy values - always put them at the end (null, undefined, empty string, NaN)
    // Keep 0 and false as valid values for sorting
    const aIsFalsy = aValue === null || aValue === undefined || aValue === '' || (typeof aValue === 'number' && isNaN(aValue))
    const bIsFalsy = bValue === null || bValue === undefined || bValue === '' || (typeof bValue === 'number' && isNaN(bValue))

    if (aIsFalsy && bIsFalsy) return 0
    if (aIsFalsy) return 1
    if (bIsFalsy) return -1

    let comparison = 0

    // Handle different data types
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      comparison = aValue.localeCompare(bValue)
    } else if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue
    } else if (aValue instanceof Date && bValue instanceof Date) {
      comparison = aValue.getTime() - bValue.getTime()
    } else {
      // Convert to strings for comparison
      comparison = String(aValue).localeCompare(String(bValue))
    }

    return isDescending ? -comparison : comparison
  })
}

// Helper function to get nested object values by dot notation
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined
  }, obj)
}

function filterByProperty(machines: Machine[], path: string, propertyValue: string): Machine[] {
  if (!path || !propertyValue) {
    return machines
  }

  const normalizedPropertyValue = String(propertyValue).toLowerCase()

  return machines.filter(machine => {
    const value = getNestedValue(machine, path)
    if (value === null || value === undefined) {
      return false
    }
    return String(value).toLowerCase() === normalizedPropertyValue
  })
}


export default defineEventHandler(async (event: H3Event): Promise<Machine[]> => {
  const machines = convertToFrontEnd(jsonMachines)
  const { location, search, pageSize, sortBy, model, type } = getQuery(event)

  let filteredMachines = machines

  // Apply universal search if search term exists
  if (search && typeof search === 'string') {
    filteredMachines = universalSearch(filteredMachines, search)
  }

  // Apply sorting if sortBy exists
  if (sortBy && typeof sortBy === 'string') {
    filteredMachines = sortMachines(filteredMachines, sortBy)
  }

  if (model && model !== 'All') {
    filteredMachines = filterByProperty(filteredMachines, 'model', model as string)
  }

  if (type && type !== 'All') {
    filteredMachines = filterByProperty(filteredMachines, 'type', type as string)
  }

  return l.take(filteredMachines, (pageSize || 20) as number)
})