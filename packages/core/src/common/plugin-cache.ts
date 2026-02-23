import crypto from 'crypto'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'

interface PluginManifest {
  version: string
  timestamp: number
  rcHash: string
  plugins: Record<string, string>
}

const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours
const LOCAL_MANIFEST_NAME = 'semo-plugin-manifest.json'

function getCacheDir(scriptName: string): string {
  const home = process.env.HOME
  if (!home) return ''
  return path.resolve(home, `.${scriptName}`, 'cache')
}

function getCachePath(scriptName: string): string {
  const cacheDir = getCacheDir(scriptName)
  if (!cacheDir) return ''
  return path.resolve(cacheDir, 'plugin-manifest.json')
}

function computeRcHash(scriptName: string): string {
  const rcPaths = [
    path.resolve(process.cwd(), `.${scriptName}rc.yml`),
    process.env.HOME
      ? path.resolve(process.env.HOME, `.${scriptName}`, `.${scriptName}rc.yml`)
      : '',
  ].filter(Boolean)

  const hash = crypto.createHash('md5')
  for (const rcPath of rcPaths) {
    if (existsSync(rcPath)) {
      hash.update(readFileSync(rcPath, 'utf8'))
    }
  }
  hash.update(process.cwd()) // cwd affects plugin discovery
  // SEMO_PLUGIN_DIR env var affects plugin discovery
  const envKey = scriptName.toUpperCase() + '_PLUGIN_DIR'
  if (process.env[envKey]) {
    hash.update(process.env[envKey])
  }
  return hash.digest('hex')
}

export function getLocalManifestPath(): string {
  return path.resolve(process.cwd(), LOCAL_MANIFEST_NAME)
}

export function getGlobalManifestPath(scriptName: string): string {
  return getCachePath(scriptName)
}

export function loadLocalPluginManifest(
  scriptName: string,
  version: string
): Record<string, string> | null {
  const localPath = getLocalManifestPath()
  if (!existsSync(localPath)) return null

  try {
    const content = readFileSync(localPath, 'utf8')
    const manifest: PluginManifest = JSON.parse(content)

    // Invalidate if version changed
    if (manifest.version !== version) return null

    // No TTL check for local manifest (manually managed)

    // Verify plugin paths still exist
    for (const pluginPath of Object.values(manifest.plugins)) {
      if (!existsSync(pluginPath)) return null
    }

    return manifest.plugins
  } catch {
    return null
  }
}

export function saveLocalPluginManifest(
  scriptName: string,
  version: string,
  plugins: Record<string, string>
): void {
  const localPath = getLocalManifestPath()

  const manifest: PluginManifest = {
    version,
    timestamp: Date.now(),
    rcHash: computeRcHash(scriptName),
    plugins,
  }

  try {
    writeFileSync(localPath, JSON.stringify(manifest, null, 2))
  } catch {
    // Silently fail
  }
}

export function clearLocalPluginManifest(): void {
  const localPath = getLocalManifestPath()
  if (existsSync(localPath)) {
    try {
      unlinkSync(localPath)
    } catch {
      // Silently fail
    }
  }
}

export function loadPluginManifest(
  scriptName: string,
  version: string
): Record<string, string> | null {
  const cachePath = getCachePath(scriptName)
  if (!cachePath || !existsSync(cachePath)) return null

  try {
    const content = readFileSync(cachePath, 'utf8')
    const manifest: PluginManifest = JSON.parse(content)

    // Invalidate if version changed
    if (manifest.version !== version) return null

    // Invalidate if too old
    if (Date.now() - manifest.timestamp > CACHE_TTL) return null

    // Invalidate if rc files changed
    const currentHash = computeRcHash(scriptName)
    if (manifest.rcHash !== currentHash) return null

    // Verify plugin paths still exist
    for (const pluginPath of Object.values(manifest.plugins)) {
      if (!existsSync(pluginPath)) return null
    }

    return manifest.plugins
  } catch {
    return null
  }
}

export function savePluginManifest(
  scriptName: string,
  version: string,
  plugins: Record<string, string>
): void {
  const cachePath = getCachePath(scriptName)
  if (!cachePath) return

  const cacheDir = path.dirname(cachePath)
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true })
  }

  const manifest: PluginManifest = {
    version,
    timestamp: Date.now(),
    rcHash: computeRcHash(scriptName),
    plugins,
  }

  try {
    writeFileSync(cachePath, JSON.stringify(manifest, null, 2))
  } catch {
    // Silently fail - cache is optional
  }
}

export function clearPluginManifest(scriptName: string): void {
  const cachePath = getCachePath(scriptName)
  if (cachePath && existsSync(cachePath)) {
    try {
      unlinkSync(cachePath)
    } catch {
      // Silently fail
    }
  }
}
