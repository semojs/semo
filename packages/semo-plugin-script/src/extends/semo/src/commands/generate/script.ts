import { error, success } from '@semo/core'
import day from 'dayjs'
import _ from 'lodash'
import { existsSync, writeFileSync } from 'node:fs'
import path from 'path'

export const command = 'script <name>'
export const desc = 'Generate a script file'
export const aliases = ['scr']

export const builder = function (yargs) {
  yargs.option('typescript', {
    alias: 'ts',
    describe: 'generate typescript style code',
  })

  yargs.option('format', {
    default: 'esm',
    describe: 'command format, support cjs, esm, typescript, esm as default',
    choices: ['cjs', 'esm', 'typescript'],
  })
}

export const handler = function (argv: any) {
  if (argv.typescript || argv.ts) {
    argv.format = 'typescript'
  }
  const scriptDir = argv.scriptMakeDir || argv.scriptDir
  if (!scriptDir || !existsSync(scriptDir)) {
    error(
      '"scriptDir" missing in config file or not exist in current directory!'
    )
    return
  }

  const filePrefix = day().format('YYYYMMDDHHmmssSSS')
  const scriptFile = path.resolve(
    scriptDir,
    `${filePrefix}_${_.kebabCase(argv.name)}.${argv.typescript ? 'ts' : 'js'}`
  )
  if (existsSync(scriptFile)) {
    error('Script file exist!')
    return
  }
  let code: string

  switch (argv.format) {
    case 'cjs':
      code = `exports.builder = function (yargs) {
  // yargs.option('option', {default, describe, alias})
}

exports.handler = async function (argv) {
  console.log('Start to draw your dream code!')
}
`
      break
    case 'esm':
      code = `export const builder = function (yargs) {
  // yargs.option('option', {default, describe, alias})
}

export const handler = async function (argv) {
  console.log('Start to draw your dream code!')
}
`
      break
    case 'typescript':
      code = `export const builder = function (yargs: any) {
  // yargs.option('option', {default, describe, alias})
}

export const handler = async function (argv: any) {
  console.log('Start to draw your dream code!')
}
`
      break
  }

  if (!existsSync(scriptFile)) {
    writeFileSync(scriptFile, code)
    success(`${scriptFile} created!`)
  }
}
