import React, { useEffect, useState } from 'react'
import { Box, Text, useApp, useInput } from 'ink'
import path from 'path'
import { readConfig, readCollection } from '../lib/storage.ts'
import { executeRequest, buildCurlDisplayCommand } from '../lib/executor.ts'
import { methodColor, formatJson } from '../lib/format.ts'
import ListView from './ListView.tsx'
import DetailView from './DetailView.tsx'
import ParamInputView from './ParamInputView.tsx'
import ResponseView from './ResponseView.tsx'
import ExecutingView from './ExecutingView.tsx'
import PromptView from './PromptView.tsx'
import { ensureDir, writeConfig, writeCollection } from '../lib/storage.ts'
import { parseOpenApi } from '../lib/parser.ts'
import type { ApiRequest, Collection, Config, ExecutionResult, ParamInput } from '../types.ts'

type AppView =
  | { type: 'loading' }
  | { type: 'no-collection' }
  | { type: 'list' }
  | { type: 'detail'; request: ApiRequest }
  | { type: 'param-input'; request: ApiRequest; params: ParamInput[] }
  | { type: 'executing'; request: ApiRequest; curlCommand: string; startTime: number }
  | { type: 'response'; request: ApiRequest; result: ExecutionResult }
  | { type: 'import-prompt' }
  | { type: 'config-prompt' }
  | { type: 'error'; message: string }

function buildParamInputs(request: ApiRequest): ParamInput[] {
  const inputs: ParamInput[] = []

  for (const p of request.parameters.filter(p => p.in === 'path')) {
    inputs.push({
      key: `path.${p.name}`,
      label: p.name,
      type: p.type,
      required: true,
      example: p.example,
      description: p.description,
    })
  }

  for (const p of request.parameters.filter(p => p.in === 'query' && p.required)) {
    inputs.push({
      key: `query.${p.name}`,
      label: p.name,
      type: p.type,
      required: true,
      example: p.example,
      description: p.description,
    })
  }

  if (request.requestBody && request.requestBody.fields.length > 0) {
    const exampleObj: Record<string, unknown> = {}
    for (const f of request.requestBody.fields) {
      if (f.example !== undefined) exampleObj[f.name] = f.example
    }
    inputs.push({
      key: 'body.__json__',
      label: 'Request Body',
      type: 'json',
      required: true,
      example: JSON.stringify(exampleObj),
      description: request.requestBody.contentType,
    })
  }

  return inputs
}

interface AppProps {
  onOpenInPager?: (body: string) => void
}

export default function App({ onOpenInPager }: AppProps = {}) {
  const { exit } = useApp()
  const [view, setView] = useState<AppView>({ type: 'loading' })
  const [collection, setCollection] = useState<Collection | null>(null)
  const [config, setConfig] = useState<Config | null>(null)

  const isTextInputActive =
    view.type === 'import-prompt' ||
    view.type === 'config-prompt' ||
    view.type === 'param-input'

  useEffect(() => {
    async function init() {
      try {
        const [col, cfg] = await Promise.all([readCollection(), readConfig()])
        setCollection(col)
        setConfig(cfg)
        setView(col ? { type: 'list' } : { type: 'no-collection' })
      } catch (err) {
        setView({ type: 'error', message: err instanceof Error ? err.message : String(err) })
      }
    }
    init()
  }, [])

  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      exit()
      return
    }

    if (view.type === 'list' || view.type === 'no-collection') {
      if (input === 'q') exit()
      if (input === 'i') setView({ type: 'import-prompt' })
      if (input === 'c') setView({ type: 'config-prompt' })
    }

    if (view.type === 'detail') {
      if (input === 'b' || key.escape) {
        setView({ type: 'list' })
        return
      }
      if (key.return) {
        const params = buildParamInputs(view.request)
        if (params.length > 0) {
          setView({ type: 'param-input', request: view.request, params })
        } else {
          runRequest(view.request, {})
        }
      }
    }

    if (view.type === 'response') {
      if (input === 'b' || key.escape) {
        setView({ type: 'list' })
      }
      if (input === 'o' && onOpenInPager) {
        onOpenInPager(formatJson(view.result.body))
        exit()
      }
      if (input === 'e' && config?.editor) {
        const filePath = path.join(process.cwd(), '.milkman', 'last-response.json')
        Bun.write(filePath, formatJson(view.result.body)).then(() => {
          Bun.spawn([...config.editor!.split(' '), filePath])
        })
      }
    }
  }, { isActive: !isTextInputActive })

  async function runRequest(request: ApiRequest, paramValues: Record<string, string>) {
    if (!config) {
      setView({ type: 'error', message: 'No base URL configured. Run: milkman config url <url>' })
      return
    }
    const curlCommand = buildCurlDisplayCommand(request, config, paramValues)
    setView({ type: 'executing', request, curlCommand, startTime: Date.now() })
    const result = await executeRequest(request, config, paramValues)
    setView({ type: 'response', request, result })
  }

  async function handleImport(filePath: string) {
    try {
      const col = parseOpenApi(filePath)
      ensureDir()
      await writeCollection(col)
      const existingConfig = await readConfig()
      const newConfig: Config = {
        baseUrl: existingConfig?.baseUrl ?? '',
        collectionName: col.name,
        importedAt: new Date().toISOString(),
      }
      await writeConfig(newConfig)
      setCollection(col)
      setConfig(newConfig)
      setView({ type: 'list' })
    } catch (err) {
      setView({ type: 'error', message: err instanceof Error ? err.message : String(err) })
    }
  }

  async function handleConfigUrl(url: string) {
    try {
      ensureDir()
      const existingConfig = await readConfig()
      const newConfig: Config = { ...existingConfig, baseUrl: url }
      await writeConfig(newConfig)
      setConfig(newConfig)
      setView(collection ? { type: 'list' } : { type: 'no-collection' })
    } catch (err) {
      setView({ type: 'error', message: err instanceof Error ? err.message : String(err) })
    }
  }

  function renderView() {
    switch (view.type) {
      case 'loading':
        return <Text color="gray">Loading...</Text>

      case 'no-collection':
        return (
          <Box flexDirection="column" gap={1}>
            <Text color="yellow">No collection loaded.</Text>
            <Text color="gray">Press [i] to import an OpenAPI file, or run: milkman import &lt;file&gt;</Text>
          </Box>
        )

      case 'list':
        if (!collection) return <Text color="red">No collection</Text>
        return (
          <ListView
            requests={collection.requests}
            onSelect={(r) => setView({ type: 'detail', request: r })}
          />
        )

      case 'detail':
        return <DetailView request={view.request} />

      case 'param-input':
        return (
          <ParamInputView
            request={view.request}
            params={view.params}
            onSubmit={(values) => runRequest(view.request, values)}
            onCancel={() => setView({ type: 'detail', request: view.request })}
          />
        )

      case 'executing':
        return (
          <ExecutingView
            request={view.request}
            curlCommand={view.curlCommand}
            startTime={view.startTime}
          />
        )

      case 'response':
        return (
          <ResponseView
            request={view.request}
            result={view.result}
            hasEditor={!!config?.editor}
            onBack={() => setView({ type: 'list' })}
          />
        )

      case 'import-prompt':
        return (
          <PromptView
            label="Import OpenAPI file"
            placeholder="path/to/openapi.yaml"
            onSubmit={(filePath) => handleImport(filePath)}
            onCancel={() => setView(collection ? { type: 'list' } : { type: 'no-collection' })}
          />
        )

      case 'config-prompt':
        return (
          <PromptView
            label="Set base URL"
            placeholder="https://api.example.com"
            initialValue={config?.baseUrl ?? ''}
            onSubmit={(url) => handleConfigUrl(url)}
            onCancel={() => setView(collection ? { type: 'list' } : { type: 'no-collection' })}
          />
        )

      case 'error':
        return (
          <Box flexDirection="column" gap={1}>
            <Text color="red" bold>Error</Text>
            <Text color="red">{view.message}</Text>
            <Text color="gray">Press [q] to quit or [i] to import</Text>
          </Box>
        )
    }
  }

  function renderFooter() {
    switch (view.type) {
      case 'list':
        return <Text color="gray">[↑↓] navigate · [↵] select · [i] import · [c] config URL · [q] quit</Text>
      case 'no-collection':
      case 'error':
        return <Text color="gray">[i] import · [c] config URL · [q] quit</Text>
      default:
        return null
    }
  }

  return (
    <Box flexDirection="column" gap={1} paddingX={1} paddingY={0}>
      <Box borderStyle="single" borderColor="cyan" paddingX={1}>
        <Text bold color="cyan">milkman</Text>
        {collection && <Text color="gray">  {collection.name}</Text>}
        {config?.baseUrl && <Text color="gray">  {config.baseUrl}</Text>}
      </Box>

      <Box flexDirection="column">
        {renderView()}
      </Box>

      {renderFooter()}
    </Box>
  )
}
