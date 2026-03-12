import React, { useState } from 'react'
import { Box, Text, useInput } from 'ink'
import TextInput from 'ink-text-input'

interface Props {
  label: string
  placeholder?: string
  initialValue?: string
  onSubmit: (value: string) => void
  onCancel: () => void
}

export default function PromptView({ label, placeholder, initialValue = '', onSubmit, onCancel }: Props) {
  const [value, setValue] = useState(initialValue)

  useInput((_, key) => {
    if (key.escape) onCancel()
  })

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>{label}</Text>
      <Box gap={1}>
        <Text color="cyan">{'> '}</Text>
        <TextInput
          value={value}
          onChange={setValue}
          onSubmit={onSubmit}
          placeholder={placeholder}
        />
      </Box>
      <Text color="gray">[esc] cancel · [↵] confirm</Text>
    </Box>
  )
}
