export interface ApiData<T> {
  data: T[],
  total: number
}

export interface ProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  code?: string
  errors?: Record<string, string[]>
}

export type ApiEnvelope<T> = { ok: true; data: T } | { ok: false; error: ProblemDetails }
