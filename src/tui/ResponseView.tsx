import React from 'react'
import { Box, Text } from 'ink'
import { methodColor, statusColor, formatJson } from '../lib/format.ts'
import type { ApiRequest, ExecutionResult } from '../types.ts'

interface Props {
  request: ApiRequest
  result: ExecutionResult
  onBack: () => void
}

export default function ResponseView({ request, result }: Props) {
  const mColor = methodColor(request.method) as Parameters<typeof Text>[0]['color']
  const sColor = statusColor(result.statusCode) as Parameters<typeof Text>[0]['color']

  return (
    <Box flexDirection="column" gap={1}>
      <Box gap={2}>
        <Text color={mColor} bold>{request.method}</Text>
        <Text>{request.path}</Text>
        <Text color={sColor} bold>{result.statusCode}</Text>
        <Text color="gray">{result.latencyMs}ms</Text>
      </Box>

      <Text color="gray" dimColor>{result.curlCommand}</Text>

      {result.error ? (
        <Text color="red">{result.error}</Text>
      ) : (
        <Box flexDirection="column">
          <Text bold underline>Response</Text>
          <Text>{formatJson(result.body)}</Text>
        </Box>
      )}

      <Text color="gray">Press [b] or [esc] to go back</Text>
    </Box>
  )
}
