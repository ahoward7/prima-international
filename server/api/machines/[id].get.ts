import { defineEventHandler, getQuery, getRouterParam } from 'h3'
import { ok, problem } from '~~/server/utils/api'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) return problem(event, 400, 'Missing id', 'Machine id route param is required')
  const { location } = getQuery(event)

  try {
    const fetchFn = getFetchFunction((location as string) || 'sold')
    const data = await fetchFn(id)
    return ok(event, data)
  } catch (error: any) {
    return problem(event, error?.statusCode || 500, 'Fetch failed', error?.message || 'Unexpected error')
  }
})

function getFetchFunction(location: string) {
  if (location === 'located') return getLocatedMachine
  if (location === 'archived') return getArchivedMachine
  return getSoldMachine
}

async function getLocatedMachine(id: string): Promise<Machine | null> {
  const machine = await MachineSchema.findOne({ m_id: id }).lean()
  if (!machine) return null
  const contact = (await ContactSchema.findOne({ c_id: machine.contactId }).lean()) || { company: '', name: '' }
  return { ...machine, contact } as Machine
}

async function getArchivedMachine(id: string): Promise<ArchivedMachine | null> {
  const archived = await ArchiveSchema.findOne({ a_id: id }).lean()
  if (!archived) return null
  const contactId = archived.machine?.contactId
  const contact = (await ContactSchema.findOne({ c_id: contactId }).lean()) || { company: '', name: '' }
  return { ...archived, machine: { ...archived.machine, contact } } as ArchivedMachine
}

async function getSoldMachine(id: string): Promise<SoldMachine | null> {
  const sold = await SoldSchema.findOne({ s_id: id }).lean()
  if (!sold) return null
  const contactId = sold.machine?.contactId
  const contact = (await ContactSchema.findOne({ c_id: contactId }).lean()) || { company: '', name: '' }
  return { ...sold, machine: { ...sold.machine, contact } } as SoldMachine
}
