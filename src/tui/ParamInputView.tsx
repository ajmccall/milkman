import React, { useState } from 'react'
import { Box, Text, useInput } from 'ink'
import TextInput from 'ink-text-input'
import { methodColor } from '../lib/format.ts'
import type { ApiRequest, ParamInput } from '../types.ts'

interface Props {
  request: ApiRequest
  params: ParamInput[]
  onSubmit: (values: Record<string, string>) => void
  onCancel: () => void
}

function exampleToString(example: unknown): string {
  if (example === undefined || example === null) return ''
  if (Array.isArray(example)) return example.join(', ')
  return String(example)
}

export default function ParamInputView({ request, params, onSubmit, onCancel }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [filled, setFilled] = useState<Record<string, string>>({})
  const [currentInput, setCurrentInput] = useState(() => exampleToString(params[0]?.example))

  const color = methodColor(request.method) as Parameters<typeof Text>[0]['color']
  const current = params[currentIndex]

  useInput((_, key) => {
    if (key.escape) onCancel()
  })

  function handleSubmit(value: string) {
    const next = { ...filled, [current.key]: value }
    if (currentIndex < params.length - 1) {
      setFilled(next)
      setCurrentInput(exampleToString(params[currentIndex + 1]?.example))
      setCurrentIndex(currentIndex + 1)
    } else {
      onSubmit(next)
    }
  }

  if (!current) return null

  const exampleHint = current.example !== undefined ? exampleToString(current.example) : undefined
  const isJson = current.type === 'json'

  const jsonPreview = isJson && exampleHint
    ? (() => { try { return JSON.stringify(JSON.parse(exampleHint), null, 2) } catch { return exampleHint } })()
    : undefined

  return (
    <Box flexDirection="column" gap={1}>
      <Box gap={1}>
        <Text color={color} bold>{request.method}</Text>
        <Text bold>{request.path}</Text>
      </Box>

      <Box flexDirection="column" gap={0}>
        <Box gap={1}>
          <Text bold>{current.label}</Text>
          {current.description && <Text color="gray">({current.description})</Text>}
        </Box>
        {isJson && jsonPreview && (
          <Box flexDirection="column" borderStyle="single" borderColor="gray" paddingX={1} marginTop={0}>
            {jsonPreview.split('\n').map((line, i) => (
              <Text key={i} color="cyan">{line}</Text>
            ))}
          </Box>
        )}
        {!isJson && current.description && <Text color="gray">{current.description}</Text>}
        {!isJson && exampleHint && <Text color="gray">Example: {exampleHint}</Text>}
      </Box>

      <Box gap={1}>
        <Text color="cyan">{'> '}</Text>
        <TextInput
          value={currentInput}
          onChange={setCurrentInput}
          onSubmit={handleSubmit}
          placeholder={isJson ? 'edit JSON or press ↵ to use example above' : (exampleHint ?? current.label)}
        />
      </Box>

      <Box justifyContent="space-between">
        <Text color="gray">{isJson ? 'Edit or press [↵] to use as-is' : `Param ${currentIndex + 1} of ${params.length}`}</Text>
        <Text color="gray">[esc] cancel</Text>
      </Box>
    </Box>
  )
}
