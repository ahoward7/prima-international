import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event): Promise<{ [key: string]: string[] }> => {
  const { serialNumber }: { [key: string]: string } = getQuery(event)

  if (!serialNumber) {
    return {
      located: [],
      archived: [],
      sold: []
    }
  }

  const machines: Machine[] = await MachineSchema.find({ serialNumber })
  const locatedNumbers: string[] = machines.map(m => m.serialNumber || '')

  const archived: ArchivedMachine[] = await ArchiveSchema.find({ "machine.serialNumber": serialNumber })
  const archivedNumbers: string[] = archived.map(a => a.machine.serialNumber || '')

  return {
    located: locatedNumbers,
    archived: archivedNumbers,
    sold: []
  }
})