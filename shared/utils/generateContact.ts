import type { Contact } from '../types/main'
import { generateRandom10DigitNumber } from './generateRandom10DigitNumber'

export function generateContact(name: string, company: string, date: string): Contact {
  return {
    c_id: generateRandom10DigitNumber(),
    name,
    company,
    createDate: date,
    lastModDate: date
  }
}