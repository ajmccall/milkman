export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

export interface Parameter {
  name: string
  in: 'path' | 'query' | 'header'
  required: boolean
  type: string
  description?: string
  example?: unknown
}

export interface BodyField {
  name: string
  type: string
  itemType?: string
  required: boolean
  description?: string
  example?: unknown
}

export interface RequestBody {
  contentType: string
  fields: BodyField[]
}

export interface ApiRequest {
  id: string
  method: HttpMethod
  path: string
  summary: string
  description?: string
  tags: string[]
  parameters: Parameter[]
  requestBody: RequestBody | null
}

export interface Collection {
  name: string
  version: string
  requests: ApiRequest[]
}

export interface Config {
  baseUrl: string
  collectionName?: string
  importedAt?: string
  editor?: string
}

export interface RequestTimings {
  dnsMs: number       // DNS lookup
  tcpMs: number       // TCP connect (delta)
  tlsMs: number       // TLS handshake (delta, 0 for HTTP)
  serverMs: number    // server processing / time to first byte (delta)
  transferMs: number  // content download (delta)
  totalMs: number     // wall-clock total
}

export interface ExecutionResult {
  statusCode: number
  body: string
  latencyMs: number
  curlCommand: string
  timings?: RequestTimings
  error?: string
}

export interface ParamInput {
  key: string
  label: string
  type: string
  required: boolean
  example?: unknown
  description?: string
}
