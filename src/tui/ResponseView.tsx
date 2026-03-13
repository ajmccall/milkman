import React from 'react'
import { Box, Text } from 'ink'
import { methodColor, statusColor, formatJson } from '../lib/format.ts'
import type { ApiRequest, ExecutionResult } from '../types.ts'

const LONG_RESPONSE_THRESHOLD = 100

interface Props {
  request: ApiRequest
  result: ExecutionResult
  hasEditor: boolean
  onBack: () => void
}

export default function ResponseView({ request, result, hasEditor }: Props) {
  const mColor = methodColor(request.method) as Parameters<typeof Text>[0]['color']
  const sColor = statusColor(result.statusCode) as Parameters<typeof Text>[0]['color']

  const formatted = formatJson(result.body)
  const lineCount = formatted.split('\n').length
  const isLong = lineCount > LONG_RESPONSE_THRESHOLD

  const hints = [
    '[b/esc] back',
    '[o] open in pager',
    hasEditor ? '[e] open in editor' : null,
  ].filter(Boolean).join(' · ')

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
      ) : isLong ? (
        <Box flexDirection="column" gap={1}>
          <Text bold underline>Response</Text>
          <Text color="yellow">Response is {lineCount} lines — too long to display inline.</Text>
        </Box>
      ) : (
        <Box flexDirection="column">
          <Text bold underline>Response</Text>
          <Text>{formatted}</Text>
        </Box>
      )}

      <Text color="gray">{hints}</Text>
    </Box>
  )
}
