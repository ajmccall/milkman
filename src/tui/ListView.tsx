import React from 'react'
import { Text } from 'ink'
import SelectInput from 'ink-select-input'
import { methodColor } from '../lib/format.ts'
import type { ApiRequest } from '../types.ts'

interface Props {
  requests: ApiRequest[]
  onSelect: (request: ApiRequest) => void
}

function methodBadge(method: string): string {
  return method.padEnd(7)
}

export default function ListView({ requests, onSelect }: Props) {
  const items = requests.map(r => ({
    key: r.id,
    label: `${methodBadge(r.method)} ${r.path}  ${r.summary.slice(0, 50)}`,
    value: r,
  }))

  return (
    <SelectInput
      items={items}
      onSelect={(item) => onSelect(item.value)}
      itemComponent={({ label, isSelected, value }) => {
        const method = (value as ApiRequest).method
        const color = methodColor(method) as Parameters<typeof Text>[0]['color']
        const badge = methodBadge(method)
        const rest = label.slice(badge.length)
        return (
          <Text>
            {isSelected ? <Text color="cyan">{'> '}</Text> : <Text>{'  '}</Text>}
            <Text color={color} bold>{badge}</Text>
            <Text color={isSelected ? 'white' : 'gray'}>{rest}</Text>
          </Text>
        )
      }}
    />
  )
}
