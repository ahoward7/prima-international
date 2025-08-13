import type { H3Event} from 'h3'
import { setResponseHeader, setResponseStatus } from 'h3'

export function ok<T>(event: H3Event, data: T, status = 200, headers?: Record<string, string>) {
  setResponseStatus(event, status)
  if (headers) {
    for (const [k, v] of Object.entries(headers)) setResponseHeader(event, k, v)
  }
  return { data }
}

export function created<T>(event: H3Event, data: T, location: string) {
  return ok(event, data, 201, { Location: location })
}

export function problem( event: H3Event, status: number, title: string, detail?: string, extra?: Partial<ProblemDetails>) {
  setResponseStatus(event, status)
  return {
    error: {
      title,
      status,
      detail,
      ...extra
    } as ProblemDetails
  }
}
