import { findUpSync } from 'find-up'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { warn } from './log.js'
import { getPackagePath } from './utils.js'

const require = createRequire(import.meta.url)

export interface PackageManagerContext {
  scriptName: string
  parsedArgv: Record<string, unknown>
  debugCore: (...rest: unknown[]) => void
  parseRcFile(plugin: string, pluginPath: string): Record<string, unknown>
}

export function convertToPrivate(packageJsonPath: string): void {
  try {
    const content = readFileSync(packageJsonPath, 'utf8')
    const pkg = JSON.parse(content)
    pkg.private = true
    writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2))
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    warn(msg)
  }
}

function ensureDownloadDir(downloadDir: string): void {
  mkdirSync(downloadDir, { recursive: true })
  if (!existsSync(path.resolve(downloadDir, 'package.json'))) {
    spawnSync('npm', ['init', '-y'], { cwd: downloadDir, stdio: 'inherit' })
    convertToPrivate(path.resolve(downloadDir, 'package.json'))
  }
}

function getDownloadDir(
  scriptName: string,
  location: string,
  home: boolean
): string {
  const baseDir = home
    ? path.resolve(process.env.HOME || '', `.${scriptName}`)
    : process.cwd()
  return location ? path.resolve(baseDir, location) : baseDir
}

export async function installPackage(
  ctx: PackageManagerContext,
  name: string,
  location = '',
  home = true,
  force = false
): Promise<void> {
  const nameArray = Array.isArray(name) ? name : [name]
  const argv = ctx.parsedArgv
  const scriptName = argv && argv.scriptName ? String(argv.scriptName) : 'semo'

  const downloadDir = getDownloadDir(scriptName, location, home)
  ensureDownloadDir(downloadDir)

  const npmFlags = [
    '--prefix',
    downloadDir,
    '--no-package-lock',
    '--no-audit',
    '--no-fund',
    '--no-bin-links',
  ]

  if (force) {
    spawnSync('npm', ['install', ...nameArray, '--force', ...npmFlags], {
      stdio: 'inherit',
    })
  }

  for (const pkg of nameArray) {
    try {
      require.resolve(pkg, { paths: [downloadDir] })
    } catch (e: unknown) {
      if ((e as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND') {
        spawnSync('npm', ['install', pkg, ...npmFlags], { stdio: 'inherit' })
      }
    }
  }
}

export async function uninstallPackage(
  ctx: PackageManagerContext,
  name: string,
  location = '',
  home = true
): Promise<void> {
  const nameArray = Array.isArray(name) ? name : [name]
  const argv = ctx.parsedArgv
  const scriptName = argv && argv.scriptName ? String(argv.scriptName) : 'semo'

  const downloadDir = getDownloadDir(scriptName, location, home)
  ensureDownloadDir(downloadDir)

  spawnSync(
    'npm',
    [
      'uninstall',
      ...nameArray,
      '--prefix',
      downloadDir,
      '--no-package-lock',
      '--no-audit',
      '--no-fund',
      '--no-bin-links',
    ],
    { stdio: 'inherit' }
  )
}

export async function importPackage(
  ctx: PackageManagerContext,
  name: string,
  location = '',
  home = true,
  force = false
  // Returns `unknown` — callers must narrow the type after import
): Promise<unknown> {
  let pkg: unknown, pkgPath: string

  const scriptName = ctx.scriptName
  const downloadDir = getDownloadDir(scriptName, location, home)
  ensureDownloadDir(downloadDir)

  const npmFlags = [
    '--prefix',
    downloadDir,
    '--no-package-lock',
    '--no-audit',
    '--no-fund',
    '--no-bin-links',
  ]

  if (force) {
    spawnSync('npm', ['install', name, ...npmFlags], { stdio: 'inherit' })
  }

  try {
    pkgPath = require.resolve(name, { paths: [downloadDir] })
    pkg = await import(pkgPath)
  } catch (e: unknown) {
    if ((e as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND') {
      spawnSync('npm', ['install', name, ...npmFlags], { stdio: 'inherit' })
      try {
        pkgPath = require.resolve(name, { paths: [downloadDir] })
        pkg = await import(pkgPath)
      } catch {
        warn(`Module ${name} not found, you may need to re-run the command`)
      }
    }
  }

  // For CJS modules, import() wraps the export in { default: ... }
  // Unwrap to provide the actual module directly
  if (pkg && typeof pkg === 'object' && 'default' in pkg) {
    return (pkg as Record<string, unknown>).default
  }

  return pkg
}

export function loadPluginRc(
  ctx: PackageManagerContext,
  name: string,
  location = '',
  home = true
): Record<string, unknown> {
  const scriptName = ctx.scriptName
  const baseDir = home
    ? path.resolve(process.env.HOME || '', `.${scriptName}`)
    : process.cwd()
  const downloadDirNodeModulesPath = path.resolve(baseDir, location)

  mkdirSync(baseDir, { recursive: true })
  mkdirSync(downloadDirNodeModulesPath, { recursive: true })

  const packagePath = getPackagePath(name, [downloadDirNodeModulesPath])
  if (!packagePath) return {}
  const packageDirectory = path.dirname(packagePath)

  const pluginConfig = ctx.parseRcFile(name, packageDirectory)
  pluginConfig.dirname = packageDirectory

  return pluginConfig
}

export function resolvePackage(
  scriptName: string,
  name: string,
  location: string = '',
  home = true
): string {
  const baseDir = home
    ? path.resolve(process.env.HOME || '', `.${scriptName}`)
    : process.cwd()
  const downloadDirNodeModulesPath = path.resolve(baseDir, location)

  mkdirSync(baseDir, { recursive: true })
  mkdirSync(downloadDirNodeModulesPath, { recursive: true })

  const pkgPath = require.resolve(name, {
    paths: [downloadDirNodeModulesPath],
  })
  return pkgPath
}

export function loadPackageInfo(
  pkg: string | undefined = undefined,
  paths: string[] = []
): Record<string, unknown> {
  const packagePath = getPackagePath(pkg, paths)
  if (!packagePath) return {}
  const content = readFileSync(packagePath, 'utf-8')
  return JSON.parse(content)
}

export function loadCorePackageInfo(coreDir: string): Record<string, unknown> {
  const packagePath = findUpSync('package.json', {
    cwd: path.resolve('../../', coreDir),
  })
  if (!packagePath) return {}

  const content = readFileSync(packagePath, 'utf-8')
  return JSON.parse(content)
}
