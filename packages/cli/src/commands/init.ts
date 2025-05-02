import {
  Argv,
  ArgvExtraOptions,
  error,
  exec,
  info,
  parsePackageNames,
  warn,
} from '@semo/core'
import _ from 'lodash'
import { existsSync, writeFileSync } from 'node:fs'
import path from 'path'
import shell from 'shelljs'
import yaml from 'yaml'

export const plugin = 'semo'
export const command = 'init'
export const desc = 'Init basic config file and directories'
export const aliases = 'i'

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
    describe: 'Package manger',
  })
}

export const handler = async function (argv: ArgvExtraOptions) {
  try {
    const defaultRc: any = argv.plugin
      ? _.pickBy({
          typescript: argv.typescript ? true : null,
          commandDir: argv.typescript ? 'lib/commands' : 'src/commands',
          extendDir: argv.typescript ? 'lib/extends' : 'src/extends',
          hookDir: argv.typescript ? 'lib/hooks' : 'src/hooks',
          commandMakeDir: argv.typescript ? 'src/commands' : null,
          extendMakeDir: argv.typescript ? 'src/extends' : null,
          hookMakeDir: argv.typescript ? 'src/hooks' : null,
        })
      : _.pickBy({
          typescript: argv.typescript ? true : null,
          commandDir: `bin/${argv.scriptName}/commands`,
          pluginDir: `bin/${argv.scriptName}/plugins`,
          extendDir: `bin/${argv.scriptName}/extends`,
          scriptDir: `bin/${argv.scriptName}/scripts`,
          hookDir: `bin/${argv.scriptName}/hooks`,
        })

    const currentPath = path.resolve(process.cwd())
    const configPath = `${currentPath}/.${argv.scriptName}rc.yml`
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

    const dirs = Object.keys(defaultRc).filter(
      (item) => item.indexOf('Dir') > -1
    )
    dirs.forEach((dir) => {
      const loc = defaultRc[dir]
      if (!existsSync(`${currentPath}/${loc}`)) {
        exec(`mkdir -p ${currentPath}/${loc}`)
        info(`${currentPath}/${loc} created!`)
      }
    })
    // add packages
    // choose package manager
    const packageJsonExists = existsSync(
      path.join(process.cwd(), 'package.json')
    )
    let pm = argv.pm
    let operation = 'add'
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
          if (existsSync(path.join(process.cwd(), lf.name))) {
            detectedPm = lf.pm
            break
          }
        }
        if (detectedPm) {
          pm = argv.pm = detectedPm
          info(`Detected package manager: ${detectedPm}`)
        } else {
          const choices = lockFiles.map((lf) => lf.pm)
          const confirmedPm = await argv.$prompt.select({
            message:
              'Choose your prefered package manager（npm/yarn/pnpm/bun):',
            choices,
            default: 'npm',
          })
          if (confirmedPm) {
            pm = argv.pm = confirmedPm
          } else {
            warn('No package manager specified, operation aborted.')
            return
          }
        }
      }
      if (!pm) {
        return error('No package manager specified, operation aborted.')
      }

      if (!shell.which(`${pm}`)) {
        error(`${pm} package manager not found.`)
        return
      }

      if (pm === 'npm') {
        operation = 'install'
      }
    }

    if (!packageJsonExists) {
      exec(`${pm} init ${pm === 'pnpm' ? '' : '--yes'}`)
    }

    // add packages
    if (argv.add) {
      const add = _.castArray(argv.add) as string[]
      const addPackage = parsePackageNames(add as string[])
      if (addPackage.length > 0) {
        exec(`${pm} ${operation} ${addPackage.join(' ')}`)
      }
    }
    if (argv.addDev) {
      const addDev = _.castArray(argv.addDev) as string[]
      const addPackageDev = parsePackageNames(addDev as string[])
      if (addPackageDev.length > 0) {
        exec(`${pm} ${operation} ${addPackageDev.join(' ')} -D`)
      }
    }
  } catch (e) {
    return error(e.stack)
  }
}
