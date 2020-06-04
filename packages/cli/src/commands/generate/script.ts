import fs from 'fs'
import path from 'path'
import { Utils } from '@semo/core'

export const command = 'script <name>'
export const desc = 'Generate a script file'

export const builder = function(yargs) {
  yargs.option('typescript', {
    alias: 'ts',
    describe: 'generate typescript style code'
  })
}

export const handler = function(argv: any) {
  let scriptDir = argv.scriptMakeDir || argv.scriptDir
  if (!scriptDir || !Utils.fileExistsSyncCache(scriptDir)) {
    console.log(Utils.chalk.red('"scriptDir" missing in config file or not exist in current directory!'))
    return
  }

  const filePrefix = Utils.day().format('YYYYMMDDHHmmssSSS')
  const scriptFile = path.resolve(scriptDir, `${filePrefix}_${Utils._.kebabCase(argv.name)}.${argv.typescript ? 'ts' : 'js'}`)
  if (Utils.fileExistsSyncCache(scriptFile)) {
    console.log(Utils.chalk.red('Scritp file exist!'))
    return
  }
  let code
  if (argv.typescript) {
    code = `export const builder = function (yargs: any) {
  // yargs.option('option', {default, describe, alias})
}

export const handler = async function (argv: any) {
  console.log('Start to draw your dream code!')
  process.exit(0)
}
`
  } else {
    code = `exports.builder = function (yargs) {
  // yargs.option('option', {default, describe, alias})
}

exports.handler = async function (argv) {
  console.log('Start to draw your dream code!')
  process.exit(0)
}
`
  }
  if (!Utils.fileExistsSyncCache(scriptFile)) {
    fs.writeFileSync(scriptFile, code)
    console.log(Utils.chalk.green(`${scriptFile} created!`))
  }
}
