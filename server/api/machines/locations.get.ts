import { defineEventHandler, getQuery } from 'h3'
import { ok } from '~~/server/utils/api'

export default defineEventHandler(async (event) => {
  const { serialNumber }: { [key: string]: string } = getQuery(event)

  if (!serialNumber) {
    return ok(event, {
      located: [],
      archived: [],
      sold: []
    } as MachineLocations)
  }

  const machines: Machine[] = await MachineSchema.find({ serialNumber })
  const locatedNumbers: string[] = machines.map(m => m.serialNumber || '')

  const archived: ArchivedMachine[] = await ArchiveSchema.find({ 'machine.serialNumber': serialNumber })
  const archivedNumbers: string[] = archived.map(a => a.machine.serialNumber || '')

  const sold: SoldMachine[] = await SoldSchema.find({ 'machine.serialNumber': serialNumber })
  const soldNumbers: string[] = sold.map(s => s.machine.serialNumber || '')

  return ok(event, {
    located: locatedNumbers,
    archived: archivedNumbers,
    sold: soldNumbers
  } as MachineLocations)
})
