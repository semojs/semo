import fs from 'fs'
import path from 'path'
import { Utils } from '@semo/core'

export const plugin = 'semo'
export const command = 'init'
export const desc = 'Init basic config file and directories'
export const aliases = 'i'

export const builder = function(yargs) {
  yargs.option('plugin', {
    alias: 'P',
    describe: 'Plugin mode'
  })

  yargs.option('force', {
    alias: 'f',
    describe: 'Force init!'
  })

  yargs.option('add', {
    default: false,
    alias: 'A',
    describe: 'Add npm package to package.json dependencies'
  })

  yargs.option('add-dev', {
    default: false,
    alias: 'D',
    describe: 'Add npm package to package.json devDependencies'
  })

  yargs.option('typescript', {
    alias: 'ts',
    describe: 'Generate typescript style code'
  })
}

export const handler = async function(argv: any) {
  argv.yarn = Utils.fileExistsSyncCache('yarn.lock')
  if (argv.yarn) {
    Utils.info('yarn.lock found, use yarn for package management.')
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
    const configPath = `${currentPath}/.${argv.scriptName}rc.yml`
    const { override } =
      Utils.fileExistsSyncCache(configPath) && !argv.force
        ? await Utils.inquirer.prompt([
            {
              type: 'confirm',
              name: 'override',
              message: `.${argv.scriptName}rc.yml exists, override?`,
              default: false
            }
          ])
        : { override: true }
    if (override === false) {
      console.log(Utils.chalk.yellow('User aborted!'))
      return
    }

    fs.writeFileSync(configPath, Utils.yaml.stringify(defaultRc, {}))
    
    console.log(Utils.chalk.green(`Default .${argv.scriptName}rc created!`))
    const dirs = Object.keys(defaultRc).filter(item => item.indexOf('Dir') > -1)
    dirs.forEach(dir => {
      // @ts-ignore
      const loc = defaultRc[dir]
      if (!Utils.fileExistsSyncCache(`${currentPath}/${loc}`)) {
        Utils.exec(`mkdir -p ${currentPath}/${loc}`)
        console.log(Utils.chalk.green(`${currentPath}/${loc} created!`))
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
