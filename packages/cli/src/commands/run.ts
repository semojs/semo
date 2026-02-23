import { ArgvExtraOptions, error } from '@semo/core'
import { spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export const noblank = true
export const plugin = 'semo'
export const command = 'run [plugin]'
export const desc = 'Run any plugin command directly'

function commandExists(cmd: string): boolean {
  return spawnSync('which', [cmd], { stdio: 'ignore' }).status === 0
}

function isLocalPath(p: string): boolean {
  return p.startsWith('.') || p.startsWith('/') || p.startsWith('~')
}

function resolveLocalPath(p: string): string {
  if (p.startsWith('~')) {
    return path.resolve(p.replace(/^~/, process.env.HOME || ''))
  }
  return path.resolve(p)
}

export const builder = function (yargs: any) {
  yargs.option('force', {
    describe: 'Force upgrade plugin cache',
    alias: 'F',
    boolean: true,
    default: false,
  })
  yargs.option('scope', { default: '', describe: 'Set plugin npm scope' })
  yargs.option('with', { describe: 'Set plugin dependent plugins' })
  yargs.option('pipe', {
    describe: 'Pipe stdin to plugin command',
    boolean: true,
    default: false,
  })
}

export const handler = async function (
  argv: ArgvExtraOptions & { [key: string]: any }
) {
  const scriptName = argv.scriptName || 'semo'
  const pluginPrefix = `${scriptName}-plugin-`

  let pluginShort = ''
  let runPluginDir = path.resolve(
    String(process.env.HOME),
    `.${scriptName}`,
    'run-plugin-cache',
    'node_modules'
  )
  let localCleanupDir: string | null = null

  if (argv.plugin) {
    if (isLocalPath(argv.plugin as string)) {
      // Local plugin path mode
      const localPath = resolveLocalPath(argv.plugin as string)

      if (!existsSync(localPath)) {
        error(`Path not found: ${localPath}`)
        return
      }

      const pkgJsonPath = path.resolve(localPath, 'package.json')
      if (!existsSync(pkgJsonPath)) {
        error(`No package.json found in ${localPath}`)
        return
      }

      const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'))
      const pkgName: string = pkgJson.name
      if (!pkgName || !pkgName.includes(pluginPrefix)) {
        error(
          `Package "${pkgName}" is not a semo plugin (expected ${pluginPrefix}*)`
        )
        return
      }

      // Determine compiled output directory from main field
      const mainField: string = pkgJson.main || ''
      const outDir = mainField ? mainField.split('/')[0] : 'lib'
      if (!existsSync(path.resolve(localPath, outDir))) {
        error(
          `Output directory "${outDir}" not found in ${localPath}, build the plugin first`
        )
        return
      }

      // Extract short name (handle scoped packages like @scope/semo-plugin-foo)
      const baseName = pkgName.includes('/')
        ? pkgName.split('/').pop()!
        : pkgName
      pluginShort = baseName.substring(
        baseName.indexOf(pluginPrefix) + pluginPrefix.length
      )

      // Create temp dir with symlink so plugin discovery can find it by name
      const tmpDir = path.join(os.tmpdir(), `semo-run-local-${Date.now()}`)
      if (pkgName.includes('/')) {
        const scope = pkgName.split('/')[0]
        mkdirSync(path.join(tmpDir, scope), { recursive: true })
        symlinkSync(localPath, path.join(tmpDir, scope, baseName))
      } else {
        mkdirSync(tmpDir, { recursive: true })
        symlinkSync(localPath, path.join(tmpDir, pkgName))
      }
      localCleanupDir = tmpDir
      runPluginDir = tmpDir
    } else {
      // NPM package mode
      if (!argv.plugin.includes(pluginPrefix)) {
        argv.plugin = `${pluginPrefix}${argv.plugin}`
      }
      if (argv.scope) {
        argv.plugin = `@${argv.scope}/${argv.plugin}`
      }

      try {
        argv.$core.installPackage(
          argv.plugin,
          'run-plugin-cache',
          true,
          argv.force
        )
      } catch {
        error(`Plugin ${argv.plugin} not found or entry not exist`)
        return
      }

      const prefixIndex = argv.plugin.indexOf(pluginPrefix)
      pluginShort = argv.plugin.substring(prefixIndex + pluginPrefix.length)
    }
  }

  // Install dependent plugins
  const deps = argv.with
    ? Array.isArray(argv.with)
      ? argv.with
      : [argv.with]
    : []
  for (const rawDep of deps) {
    let dep = rawDep as string
    if (!dep.includes(pluginPrefix)) {
      dep = `${pluginPrefix}${dep}`
    }
    if (argv.scope) {
      dep = `@${argv.scope}/${dep}`
    }
    try {
      argv.$core.installPackage(dep, 'run-plugin-cache', true, argv.force)
    } catch {
      error(`Plugin ${dep} not found or entry not exist`)
      return
    }
  }

  // Build command args
  const envKey = scriptName.toUpperCase() + '_PLUGIN_DIR'

  let cmdArgs = (argv._ as string[]).slice(1)
  if (cmdArgs.length === 0 && pluginShort) {
    cmdArgs = [pluginShort]
  }
  cmdArgs = cmdArgs.concat(argv['--'] || [])
  cmdArgs.push('--no-cache')

  const tmpPath = path.join(os.tmpdir(), `${scriptName}-stdin-${Date.now()}`)

  try {
    writeFileSync(tmpPath, argv.$input || '')

    const useScript = commandExists(scriptName)
    const bin = useScript ? scriptName : 'npx'
    const args = useScript ? cmdArgs : ['@semo/cli', ...cmdArgs]
    const env = { ...process.env, [envKey]: runPluginDir }

    argv.$debugCoreChannel(
      'run',
      `Running: ${envKey}=${runPluginDir} ${bin} ${args.join(' ')}`
    )

    spawnSync(bin, args, {
      stdio: [
        argv.pipe ? openSync(tmpPath, 'r') : 'inherit',
        'inherit',
        'inherit',
      ],
      env,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (argv.verbose) {
      error(e)
    } else {
      error(msg)
    }
  } finally {
    try {
      unlinkSync(tmpPath)
    } catch {}
    if (localCleanupDir) {
      try {
        rmSync(localCleanupDir, { recursive: true })
      } catch {}
    }
  }
}
