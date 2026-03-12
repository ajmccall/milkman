import { mkdirSync } from 'fs'
import path from 'path'
import type { Config, Collection } from '../types.ts'

const dir = () => path.join(process.cwd(), '.milkman')
const configPath = () => path.join(dir(), 'config.json')
const collectionPath = () => path.join(dir(), 'collection.json')

export function ensureDir(): void {
  mkdirSync(dir(), { recursive: true })
}

export async function readConfig(): Promise<Config | null> {
  const file = Bun.file(configPath())
  if (!(await file.exists())) return null
  return file.json() as Promise<Config>
}

export async function writeConfig(config: Config): Promise<void> {
  ensureDir()
  await Bun.write(configPath(), JSON.stringify(config, null, 2))
}

export async function readCollection(): Promise<Collection | null> {
  const file = Bun.file(collectionPath())
  if (!(await file.exists())) return null
  return file.json() as Promise<Collection>
}

export async function writeCollection(collection: Collection): Promise<void> {
  ensureDir()
  await Bun.write(collectionPath(), JSON.stringify(collection, null, 2))
}
