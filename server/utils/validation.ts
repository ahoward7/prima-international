import type { H3Event } from 'h3'
import type { ZodError } from 'zod'
import { z } from 'zod'
import { problem } from './api'

export function zodProblem(event: H3Event, err: ZodError, status = 400) {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of err.issues) {
    const key = issue.path.join('.') || '_'
    if (!fieldErrors[key]) fieldErrors[key] = []
    fieldErrors[key].push(issue.message)
  }
  return problem(event, status, 'Validation error', 'Request validation failed', { errors: fieldErrors })
}

// Schemas
export const ContactFormSchema = z.object({
  c_id: z.string().optional(),
  company: z.string().optional(),
  name: z.string().optional()
}).partial()

export const MachineCreateSchema = z.object({
  type: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  year: z.number().int().min(0).max(9999).optional(),
  hours: z.number().int().min(0).optional(),
  description: z.string().optional(),
  salesman: z.string().default(''),
  price: z.number().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  contact: ContactFormSchema.extend({ c_id: z.string().optional() })
})

export const MachinePostSchema = MachineCreateSchema.extend({
  createDate: z.string().optional(),
  lastModDate: z.string().optional()
})

export const MachineArchiveSchema = MachineCreateSchema.extend({
  createDate: z.string().optional(),
  lastModDate: z.string().optional()
})

export const ArchiveBodySchema = z.union([
  z.object({ archiveDate: z.string().optional() }),
  MachineArchiveSchema
])

export const SoldBodySchema = z.object({
  machine: MachinePostSchema,
  sold: z.object({
    dateSold: z.string().optional(),
    truckingCompany: z.string().optional(),
    buyer: z.string().optional(),
    buyerLocation: z.string().optional(),
    purchaseFob: z.string().optional(),
    machineCost: z.number().optional(),
    freightCost: z.number().optional(),
    paintCost: z.number().optional(),
    otherCost: z.number().optional(),
    profit: z.number().optional(),
    totalCost: z.number().optional(),
    notes: z.string().optional()
  }).partial()
})
