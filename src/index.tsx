#!/usr/bin/env bun
import React from 'react'
import { render } from 'ink'
import { tmpdir } from 'os'
import { unlinkSync } from 'fs'
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

async function handleConfigEditor(command: string): Promise<void> {
  ensureDir()
  const existingConfig = await readConfig()
  const config: Config = { ...existingConfig, editor: command }
  await writeConfig(config)
  console.log(`Editor set to: ${command}`)
}

async function launchTui() {
  let pendingPagerBody: string | null = null

  const { waitUntilExit } = render(
    <App onOpenInPager={(body) => { pendingPagerBody = body }} />
  )
  await waitUntilExit()

  if (pendingPagerBody) {
    const body = pendingPagerBody
    const tmpFile = `${tmpdir()}/milkman-response-${Date.now()}.json`
    await Bun.write(tmpFile, body)
    Bun.spawnSync([process.env.PAGER ?? 'less', tmpFile], {
      stdin: 'inherit',
      stdout: 'inherit',
      stderr: 'inherit',
    })
    try { unlinkSync(tmpFile) } catch {}
    await launchTui()
  }
}

async function main() {
  if (args[0] === 'import' && args[1]) {
    await handleImport(args[1])
    await launchTui()
  } else if (args[0] === 'config' && args[1] === 'url' && args[2]) {
    await handleConfigUrl(args[2])
    process.exit(0)
  } else if (args[0] === 'config' && args[1] === 'editor' && args[2]) {
    await handleConfigEditor(args.slice(2).join(' '))
    process.exit(0)
  } else {
    await launchTui()
  }
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
