import React from 'react'
import { Box, Text } from 'ink'
import { methodColor } from '../lib/format.ts'
import type { ApiRequest } from '../types.ts'

interface Props {
  request: ApiRequest
}

export default function DetailView({ request }: Props) {
  const color = methodColor(request.method) as Parameters<typeof Text>[0]['color']

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

      {request.parameters.length > 0 && (
        <Box flexDirection="column" gap={0}>
          <Text bold underline>Parameters</Text>
          {request.parameters.map(p => (
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
          <Text bold underline>Request Body ({request.requestBody.contentType})</Text>
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
