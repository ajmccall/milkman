#!/usr/bin/env bun
import React from 'react'
import { render } from 'ink'
import App from './tui/App.tsx'
import { parseOpenApi } from './lib/parser.ts'
import { ensureDir, readConfig, writeConfig, writeCollection } from './lib/storage.ts'
import type { Config } from './types.ts'

const args = process.argv.slice(2)

async function handleImport(filePath: string): Promise<void> {
  const collection = parseOpenApi(filePath)
  ensureDir()
  await writeCollection(collection)
  const existingConfig = await readConfig()
  const config: Config = {
    baseUrl: existingConfig?.baseUrl ?? '',
    collectionName: collection.name,
    importedAt: new Date().toISOString(),
  }
  await writeConfig(config)
  console.log(`Imported "${collection.name}" — ${collection.requests.length} endpoints`)
}

async function handleConfigUrl(url: string): Promise<void> {
  ensureDir()
  const existingConfig = await readConfig()
  const config: Config = { ...existingConfig, baseUrl: url }
  await writeConfig(config)
  console.log(`Base URL set to: ${url}`)
}

async function main() {
  if (args[0] === 'import' && args[1]) {
    await handleImport(args[1])
    render(<App />)
  } else if (args[0] === 'config' && args[1] === 'url' && args[2]) {
    await handleConfigUrl(args[2])
    process.exit(0)
  } else {
    render(<App />)
  }
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
