import React from 'react'
import { Box, Text } from 'ink'
import { methodColor } from '../lib/format.ts'
import type { ApiRequest } from '../types.ts'

interface Props {
  request: ApiRequest
}

const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH'])

export default function DetailView({ request }: Props) {
  const color = methodColor(request.method) as Parameters<typeof Text>[0]['color']

  const nonHeaderParams = request.parameters.filter(p => p.in !== 'header')
  const specHeaders = request.parameters.filter(p => p.in === 'header')

  const autoHeaders: { name: string; value: string }[] = []
  if (BODY_METHODS.has(request.method) && request.requestBody) {
    autoHeaders.push({ name: 'Content-Type', value: request.requestBody.contentType })
  }

  const showHeaders = autoHeaders.length > 0 || specHeaders.length > 0

  return (
    <Box flexDirection="column" gap={1}>
      <Box gap={1}>
        <Text color={color} bold>{request.method}</Text>
        <Text bold>{request.path}</Text>
      </Box>

      <Text>{request.summary}</Text>

      {request.tags.length > 0 && (
        <Text color="gray">Tags: {request.tags.join(', ')}</Text>
      )}

      {showHeaders && (
        <Box flexDirection="column" gap={0}>
          <Text bold underline>Headers</Text>
          {autoHeaders.map(h => (
            <Box key={h.name} gap={2}>
              <Text color="cyan" bold>{h.name}</Text>
              <Text color="gray">{h.value}</Text>
              <Text color="gray" dimColor>(auto)</Text>
            </Box>
          ))}
          {specHeaders.map(p => (
            <Box key={p.name} gap={2}>
              <Text color="cyan" bold>{p.name}</Text>
              <Text color="yellow">{p.type}</Text>
              <Text color={p.required ? 'red' : 'green'}>{p.required ? 'required' : 'optional'}</Text>
              {p.example !== undefined && <Text color="gray">e.g. {String(p.example)}</Text>}
            </Box>
          ))}
        </Box>
      )}

      {nonHeaderParams.length > 0 && (
        <Box flexDirection="column" gap={0}>
          <Text bold underline>Parameters</Text>
          {nonHeaderParams.map(p => (
            <Box key={p.name} gap={2}>
              <Text color="cyan" bold>{p.name}</Text>
              <Text color="gray">[{p.in}]</Text>
              <Text color="yellow">{p.type}</Text>
              <Text color={p.required ? 'red' : 'green'}>{p.required ? 'required' : 'optional'}</Text>
              {p.example !== undefined && <Text color="gray">e.g. {String(p.example)}</Text>}
            </Box>
          ))}
        </Box>
      )}

      {request.requestBody && request.requestBody.fields.length > 0 && (
        <Box flexDirection="column" gap={0}>
          <Text bold underline>Request Body</Text>
          {request.requestBody.fields.map(f => (
            <Box key={f.name} gap={2}>
              <Text color="cyan" bold>{f.name}</Text>
              <Text color="yellow">{f.type}{f.itemType ? `<${f.itemType}>` : ''}</Text>
              <Text color={f.required ? 'red' : 'green'}>{f.required ? 'required' : 'optional'}</Text>
              {f.example !== undefined && <Text color="gray">e.g. {String(f.example)}</Text>}
            </Box>
          ))}
        </Box>
      )}

      <Text color="gray">Press [↵] to execute · [b] to go back</Text>
    </Box>
  )
}
