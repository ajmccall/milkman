import { readFileSync } from 'fs'
import { parse as parseYaml } from 'yaml'
import type { Collection, ApiRequest, HttpMethod, Parameter, RequestBody, BodyField } from '../types.ts'

type AnySchema = Record<string, unknown>

function resolveRef(spec: AnySchema, ref: string): AnySchema {
  if (!ref.startsWith('#/')) return {}
  const parts = ref.slice(2).split('/')
  let current: unknown = spec
  for (const part of parts) {
    if (typeof current !== 'object' || current === null) return {}
    current = (current as AnySchema)[part]
  }
  return (current as AnySchema) ?? {}
}

function extractBodyFields(schema: AnySchema, spec: AnySchema, required: string[] = []): BodyField[] {
  if (schema['$ref']) {
    const resolved = resolveRef(spec, schema['$ref'] as string)
    const resolvedRequired = (resolved['required'] as string[]) ?? []
    return extractBodyFields(resolved, spec, resolvedRequired)
  }

  if (schema['allOf']) {
    const parts = schema['allOf'] as AnySchema[]
    const mergedRequired: string[] = [...required]
    const mergedFields: BodyField[] = []
    for (const part of parts) {
      const partRequired = (part['required'] as string[]) ?? []
      mergedRequired.push(...partRequired)
      mergedFields.push(...extractBodyFields(part, spec, partRequired))
    }
    const seen = new Set<string>()
    return mergedFields.filter(f => {
      if (seen.has(f.name)) return false
      seen.add(f.name)
      return true
    })
  }

  const properties = schema['properties'] as Record<string, AnySchema> | undefined
  if (!properties) return []

  const schemaRequired = (schema['required'] as string[]) ?? required

  return Object.entries(properties).map(([name, propSchema]): BodyField => {
    const resolved = propSchema['$ref']
      ? resolveRef(spec, propSchema['$ref'] as string)
      : propSchema

    const type = (resolved['type'] as string) ?? 'string'
    const itemsSchema = resolved['items'] as AnySchema | undefined
    const itemType = type === 'array' && itemsSchema
      ? ((itemsSchema['$ref']
          ? (resolveRef(spec, itemsSchema['$ref'] as string)['type'] as string)
          : itemsSchema['type'] as string) ?? 'string')
      : undefined

    return {
      name,
      type,
      ...(itemType ? { itemType } : {}),
      required: schemaRequired.includes(name),
      description: resolved['description'] as string | undefined,
      example: resolved['example'],
    }
  })
}

function slugify(method: string, path: string): string {
  return `${method.toLowerCase()}-${path.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}`
}

export function parseOpenApi(filePath: string): Collection {
  const content = readFileSync(filePath, 'utf-8')
  const isYaml = filePath.endsWith('.yaml') || filePath.endsWith('.yml')
  const spec: AnySchema = isYaml ? parseYaml(content) : JSON.parse(content)

  const info = spec['info'] as AnySchema
  const name = (info?.['title'] as string) ?? 'API Collection'
  const version = (info?.['version'] as string) ?? '1.0.0'

  const paths = (spec['paths'] as Record<string, AnySchema>) ?? {}
  const requests: ApiRequest[] = []

  const validMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

  for (const [pathStr, pathItem] of Object.entries(paths)) {
    for (const method of validMethods) {
      const operation = pathItem[method.toLowerCase()] as AnySchema | undefined
      if (!operation) continue

      const rawParams = (operation['parameters'] as AnySchema[]) ?? []
      const parameters: Parameter[] = rawParams.map((p): Parameter => {
        const schema = (p['schema'] as AnySchema) ?? {}
        return {
          name: p['name'] as string,
          in: p['in'] as 'path' | 'query' | 'header',
          required: (p['required'] as boolean) ?? false,
          type: (schema['type'] as string) ?? 'string',
          description: p['description'] as string | undefined,
          example: schema['example'],
        }
      })

      let requestBody: RequestBody | null = null
      const rawBody = operation['requestBody'] as AnySchema | undefined
      if (rawBody) {
        const content = (rawBody['content'] as Record<string, AnySchema>) ?? {}
        const contentType = Object.keys(content)[0] ?? 'application/json'
        const mediaType = content[contentType] ?? {}
        const bodySchema = mediaType['schema'] as AnySchema | undefined
        const fields = bodySchema ? extractBodyFields(bodySchema, spec) : []
        requestBody = { contentType, fields }
      }

      requests.push({
        id: slugify(method, pathStr),
        method,
        path: pathStr,
        summary: (operation['summary'] as string) ?? `${method} ${pathStr}`,
        description: operation['description'] as string | undefined,
        tags: (operation['tags'] as string[]) ?? [],
        parameters,
        requestBody,
      })
    }
  }

  return { name, version, requests }
}
