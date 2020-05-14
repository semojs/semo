import inquirer from 'inquirer'
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import yargs from 'yargs'
import { Utils } from '..'

export const command = 'init'
export const desc = 'Init basic config file and directories'
export const aliases = 'i'

export const builder = function(yargs: yargs.Argv) {
  yargs.option('plugin', {
    alias: 'P',
    describe: 'plugin mode'
  })

  yargs.option('force', {
    alias: 'f',
    describe: 'force init!'
  })

  yargs.option('add', {
    default: false,
    alias: 'A',
    describe: 'add npm package to package.json dependencies'
  })

  yargs.option('add-dev', {
    default: false,
    alias: 'D',
    describe: 'add npm package to package.json devDependencies'
  })

  yargs.option('typescript', {
    alias: 'ts',
    describe: 'generate typescript style code'
  })

  yargs.option('rc-format', {
    default: 'yml',
    describe: 'rc format, default is yml, also support json'
  })
}

export const handler = async function(argv: any) {
  if (!['yml', 'json'].includes(argv.rcFormat)) {
    Utils.error('Invalid --rc-format option, only support yml and json.')
    return
  }
  let defaultRc: any = argv.plugin
    ? Utils._.pickBy({
        typescript: argv.typescript ? true : null,
        commandDir: 'src/commands',
        extendDir: 'src/extends',
        hookDir: 'src/hooks'
      })
    : Utils._.pickBy({
        typescript: argv.typescript ? true : null,
        commandDir: `bin/${argv.scriptName}/commands`,
        pluginDir: `bin/${argv.scriptName}/plugins`,
        extendDir: `bin/${argv.scriptName}/extends`,
        scriptDir: `bin/${argv.scriptName}/scripts`,
        hookDir: `bin/${argv.scriptName}/hooks`
      })

  let currentPath = path.resolve(process.cwd())

  try {
    const configPath = `${currentPath}/.${argv.scriptName}rc.${argv.rcFormat ? argv.rcFormat : 'yml'}`
    const { override } =
      Utils.fileExistsSyncCache(configPath) && !argv.force
        ? await inquirer.prompt([
            {
              type: 'confirm',
              name: 'override',
              message: `.${argv.scriptName}rc.json exists, override?`,
              default: false
            }
          ])
        : { override: true }
    if (override === false) {
      console.log(chalk.yellow('User aborted!'))
      return
    }
    if (argv.rcFormat === 'yml') {
      fs.writeFileSync(configPath, Utils.yaml.stringify(defaultRc, {}))
    } else if (argv.rcFormat === 'json') {
      fs.writeFileSync(configPath, JSON.stringify(defaultRc, null, 2))
    }
    
    console.log(chalk.green(`Default .${argv.scriptName}rc created!`))
    const dirs = Object.keys(defaultRc).filter(item => item.indexOf('Dir') > -1)
    dirs.forEach(dir => {
      // @ts-ignore
      const loc = defaultRc[dir]
      if (!Utils.fileExistsSyncCache(`${currentPath}/${loc}`)) {
        Utils.exec(`mkdir -p ${currentPath}/${loc}`)
        console.log(chalk.green(`${currentPath}/${loc} created!`))
      }
    })
    // add packages
    const addPackage = Utils.parsePackageNames(argv.add)
    const addPackageDev = Utils.parsePackageNames(argv.addDev)
    if (addPackage.length > 0) {
      if (argv.yarn) {
        Utils.exec(`yarn add ${addPackage.join(' ')}`)
      } else {
        Utils.exec(`npm install ${addPackage.join(' ')}`)
      }
    }
    if (addPackageDev.length > 0) {
      if (argv.yarn) {
        Utils.exec(`yarn add ${addPackageDev.join(' ')} -D`)
      } else {
        Utils.exec(`npm install ${addPackageDev.join(' ')} --save-dev`)
      }
    }
  } catch (e) {
    return Utils.error(e.stack)
  }
}
