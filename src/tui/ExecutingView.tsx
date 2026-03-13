import React, { useEffect, useState } from 'react'
import { Box, Text } from 'ink'
import { methodColor } from '../lib/format.ts'
import type { ApiRequest } from '../types.ts'

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

interface Props {
  request: ApiRequest
  curlCommand: string
  startTime: number
}

export default function ExecutingView({ request, curlCommand, startTime }: Props) {
  const [frame, setFrame] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setFrame(f => (f + 1) % SPINNER_FRAMES.length)
      setElapsed(Date.now() - startTime)
    }, 80)
    return () => clearInterval(id)
  }, [startTime])

  const color = methodColor(request.method) as Parameters<typeof Text>[0]['color']
  const seconds = (elapsed / 1000).toFixed(1)

  // Wrap curl command at 80 chars for readability
  const maxWidth = 72
  const curlLines: string[] = []
  let remaining = curlCommand
  while (remaining.length > maxWidth) {
    const breakAt = remaining.lastIndexOf(' ', maxWidth)
    const cut = breakAt > 0 ? breakAt : maxWidth
    curlLines.push(remaining.slice(0, cut))
    remaining = remaining.slice(cut + 1)
  }
  curlLines.push(remaining)

  return (
    <Box flexDirection="column" gap={1}>
      <Box gap={1}>
        <Text color="cyan">{SPINNER_FRAMES[frame]}</Text>
        <Text color={color} bold>{request.method}</Text>
        <Text bold>{request.path}</Text>
        <Text color="gray">{seconds}s</Text>
      </Box>

      <Box flexDirection="column" gap={0}>
        <Text color="gray" dimColor>curl command</Text>
        <Box flexDirection="column" borderStyle="single" borderColor="gray" paddingX={1}>
          {curlLines.map((line, i) => (
            <Text key={i} color="gray">
              {i > 0 ? '  ' : ''}{line}{i < curlLines.length - 1 ? ' \\' : ''}
            </Text>
          ))}
        </Box>
      </Box>

      <Text color="gray" dimColor>waiting for response...</Text>
    </Box>
  )
}
