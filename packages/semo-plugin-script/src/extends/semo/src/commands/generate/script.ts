import { error, renderTemplate, success } from '@semo/core'
import { existsSync, writeFileSync } from 'node:fs'
import path from 'path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const kebabCase = (str: string) =>
  str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()

function formatTimestamp(): string {
  const now = new Date()
  const pad = (n: number, len = 2) => String(n).padStart(len, '0')
  return (
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds()) +
    pad(now.getMilliseconds(), 3)
  )
}

export const command = 'script <name>'
export const desc = 'Generate a script file'
export const aliases = ['scr']

export const builder = function (yargs: any) {
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

export const handler = async function (argv: any) {
  if (argv.typescript) {
    argv.format = 'typescript'
  }
  const scriptDir = argv.scriptMakeDir || argv.scriptDir
  if (!scriptDir || !existsSync(scriptDir)) {
    error(
      '"scriptDir" missing in config file or not exist in current directory!'
    )
    return
  }

  const filePrefix = formatTimestamp()
  const scriptFile = path.resolve(
    scriptDir,
    `${filePrefix}_${kebabCase(argv.name)}.${argv.typescript ? 'ts' : 'js'}`
  )
  if (existsSync(scriptFile)) {
    error('Script file exist!')
    return
  }

  const templatePath = path.resolve(
    __dirname,
    '../../../../../../templates/script',
    `${argv.format}.hbs`
  )
  const code = await renderTemplate(templatePath, {})

  writeFileSync(scriptFile, code)
  success(`${scriptFile} created!`)
}
