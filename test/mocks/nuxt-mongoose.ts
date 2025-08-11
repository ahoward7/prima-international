// Mock for server model exports during tests
// We export minimal stubs and allow each test to override behaviors.
import { vi } from 'vitest'

export const MachineSchema = {
  aggregate: vi.fn(async () => []),
  find: vi.fn(async () => []),
  findOne: vi.fn(async () => null),
  create: vi.fn(async (doc) => doc),
  distinct: vi.fn(async () => [])
}

export const ArchiveSchema = {
  aggregate: vi.fn(async () => []),
  find: vi.fn(async () => []),
  create: vi.fn(async (doc) => doc),
  distinct: vi.fn(async () => [])
}

export const SoldSchema = {
  aggregate: vi.fn(async () => []),
  find: vi.fn(async () => []),
  create: vi.fn(async (doc) => doc),
  distinct: vi.fn(async () => [])
}

export const ContactSchema = {
  find: vi.fn(async () => []),
  findOne: vi.fn(async () => null),
  updateOne: vi.fn(async () => ({ acknowledged: true })),
  countDocuments: vi.fn(async () => 0),
  distinct: vi.fn(async () => [])
}
