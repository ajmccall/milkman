import type { ApiRequest, Config, ExecutionResult } from '../types.ts'

const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH'])

function buildUrl(request: ApiRequest, config: Config, paramValues: Record<string, string>): string {
  let url = `${config.baseUrl}${request.path}`
  for (const param of request.parameters.filter(p => p.in === 'path')) {
    const value = paramValues[`path.${param.name}`] ?? ''
    url = url.replace(`{${param.name}}`, encodeURIComponent(value))
  }
  const queryParts: string[] = []
  for (const param of request.parameters.filter(p => p.in === 'query')) {
    const value = paramValues[`query.${param.name}`]
    if (value !== undefined && value !== '') {
      queryParts.push(`${encodeURIComponent(param.name)}=${encodeURIComponent(value)}`)
    }
  }
  if (queryParts.length > 0) {
    url += `?${queryParts.join('&')}`
  }
  return url
}

function buildBody(request: ApiRequest, paramValues: Record<string, string>): string | null {
  if (!request.requestBody || !BODY_METHODS.has(request.method)) return null
  const raw = paramValues['body.__json__']
  if (raw !== undefined && raw.trim() !== '') return raw.trim()
  return '{}'
}

export function buildCurlArgs(
  request: ApiRequest,
  config: Config,
  paramValues: Record<string, string>
): string[] {
  const url = buildUrl(request, config, paramValues)
  const args: string[] = [url, '-s', '-X', request.method]

  if (BODY_METHODS.has(request.method)) {
    args.push('-H', 'Content-Type: application/json')
    args.push('-d', buildBody(request, paramValues) ?? '{}')
  }

  args.push('-w', '\n__MM_STATUS__%{http_code}__%{time_total}__')
  return args
}

export function buildCurlDisplayCommand(
  request: ApiRequest,
  config: Config,
  paramValues: Record<string, string>
): string {
  const url = buildUrl(request, config, paramValues)
  const parts: string[] = ['curl', '-s', '-X', request.method, `"${url}"`]

  if (BODY_METHODS.has(request.method)) {
    parts.push('-H', '"Content-Type: application/json"')
    parts.push('-d', `'${buildBody(request, paramValues) ?? '{}'}'`)
  }

  return parts.join(' ')
}

export async function executeRequest(
  request: ApiRequest,
  config: Config,
  paramValues: Record<string, string>
): Promise<ExecutionResult> {
  const curlCommand = buildCurlDisplayCommand(request, config, paramValues)
  const args = buildCurlArgs(request, config, paramValues)
  const start = Date.now()

  try {
    const proc = Bun.spawn(['curl', ...args], {
      stdout: 'pipe',
      stderr: 'pipe',
    })

    const rawOutput = await new Response(proc.stdout).text()
    await proc.exited

    const latencyMs = Date.now() - start
    const marker = '\n__MM_STATUS__'
    const markerIndex = rawOutput.lastIndexOf(marker)

    if (markerIndex === -1) {
      return { statusCode: 0, body: rawOutput, latencyMs, curlCommand, error: 'Could not parse response metadata' }
    }

    const body = rawOutput.slice(0, markerIndex)
    const meta = rawOutput.slice(markerIndex + marker.length)
    const metaParts = meta.replace(/__$/, '').split('__')
    const statusCode = parseInt(metaParts[0] ?? '0', 10)

    return { statusCode, body, latencyMs, curlCommand }
  } catch (err) {
    return {
      statusCode: 0,
      body: '',
      latencyMs: Date.now() - start,
      curlCommand,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
