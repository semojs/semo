import {
  Argv,
  ArgvExtraOptions,
  error,
  info,
  parsePackageNames,
  warn,
} from '@semo/core'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'path'
import yaml from 'yaml'

export const plugin = 'semo'
export const command = 'init'
export const desc = 'Init basic config file and directories'
export const aliases = 'i'

function commandExists(cmd: string): boolean {
  return spawnSync('which', [cmd], { stdio: 'ignore' }).status === 0
}

export const builder = function (yargs: Argv) {
  yargs.option('plugin', {
    alias: 'P',
    describe: 'Plugin mode',
  })
  yargs.option('force', {
    alias: 'f',
    describe: 'Force init!',
  })
  yargs.option('add', {
    alias: 'A',
    describe: 'Add npm package to package.json dependencies',
  })
  yargs.option('add-dev', {
    alias: 'D',
    describe: 'Add npm package to package.json devDependencies',
  })
  yargs.option('typescript', {
    alias: 'ts',
    describe: 'Generate typescript style code',
  })
  yargs.option('pm', {
    default: '',
    alias: 'p',
    choices: ['npm', 'yarn', 'pnpm', 'bun', ''],
    describe: 'Package manager',
  })
}

export const handler = async function (argv: ArgvExtraOptions) {
  try {
    const defaultRc: any = argv.plugin
      ? Object.fromEntries(
          Object.entries({
            typescript: argv.typescript ? true : null,
            commandDir: argv.typescript ? 'lib/commands' : 'src/commands',
            extendDir: argv.typescript ? 'lib/extends' : 'src/extends',
            hookDir: argv.typescript ? 'lib/hooks' : 'src/hooks',
            commandMakeDir: argv.typescript ? 'src/commands' : null,
            extendMakeDir: argv.typescript ? 'src/extends' : null,
            hookMakeDir: argv.typescript ? 'src/hooks' : null,
          }).filter(([, v]) => v != null)
        )
      : Object.fromEntries(
          Object.entries({
            typescript: argv.typescript ? true : null,
            commandDir: `bin/${argv.scriptName}/commands`,
            pluginDir: `bin/${argv.scriptName}/plugins`,
            extendDir: `bin/${argv.scriptName}/extends`,
            scriptDir: `bin/${argv.scriptName}/scripts`,
            hookDir: `bin/${argv.scriptName}/hooks`,
          }).filter(([, v]) => v != null)
        )

    const currentPath = process.cwd()
    const configPath = path.resolve(currentPath, `.${argv.scriptName}rc.yml`)
    const confirmed =
      existsSync(configPath) && !argv.force
        ? await argv.$prompt.confirm({
            message: `.${argv.scriptName}rc.yml exists, override?`,
            default: false,
          })
        : true
    if (confirmed === false) {
      warn('User aborted!')
      return
    }

    writeFileSync(configPath, yaml.stringify(defaultRc, {}))
    info(`Default .${argv.scriptName}rc created!`)

    for (const key of Object.keys(defaultRc).filter((k) => k.endsWith('Dir'))) {
      const loc = path.resolve(currentPath, defaultRc[key])
      if (!existsSync(loc)) {
        mkdirSync(loc, { recursive: true })
        info(`${loc} created!`)
      }
    }

    // Package manager detection
    const packageJsonExists = existsSync(
      path.resolve(currentPath, 'package.json')
    )
    let pm = argv.pm as string
    if (argv.add || argv.addDev || !packageJsonExists) {
      if (!pm) {
        const lockFiles = [
          { name: 'package-lock.json', pm: 'npm' },
          { name: 'yarn.lock', pm: 'yarn' },
          { name: 'pnpm-lock.yaml', pm: 'pnpm' },
          { name: 'bun.lockb', pm: 'bun' },
        ]
        let detectedPm = ''
        for (const lf of lockFiles) {
          if (existsSync(path.resolve(currentPath, lf.name))) {
            detectedPm = lf.pm
            break
          }
        }
        if (detectedPm) {
          pm = detectedPm
          info(`Detected package manager: ${detectedPm}`)
        } else {
          const confirmedPm: string = await argv.$prompt.select({
            message:
              'Choose your preferred package manager (npm/yarn/pnpm/bun):',
            choices: lockFiles.map((lf) => lf.pm),
            default: 'npm',
          })
          if (confirmedPm) {
            pm = confirmedPm
          } else {
            warn('No package manager specified, operation aborted.')
            return
          }
        }
      }
      if (!pm) {
        error('No package manager specified, operation aborted.')
        return
      }

      if (!commandExists(pm)) {
        error(`${pm} package manager not found.`)
        return
      }
    }

    if (!packageJsonExists) {
      const initArgs = pm === 'pnpm' ? ['init'] : ['init', '--yes']
      spawnSync(pm, initArgs, { stdio: 'inherit' })
    }

    // Add packages
    const op = pm === 'npm' ? 'install' : 'add'
    if (argv.add) {
      const add = (Array.isArray(argv.add) ? argv.add : [argv.add]) as string[]
      const addPackage = parsePackageNames(add)
      if (addPackage.length > 0) {
        spawnSync(pm, [op, ...addPackage], { stdio: 'inherit' })
      }
    }
    if (argv.addDev) {
      const addDev = (
        Array.isArray(argv.addDev) ? argv.addDev : [argv.addDev]
      ) as string[]
      const addPackageDev = parsePackageNames(addDev)
      if (addPackageDev.length > 0) {
        spawnSync(pm, [op, ...addPackageDev, '-D'], { stdio: 'inherit' })
      }
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.stack || e.message : String(e)
    error(msg)
  }
}
