import { ArgvExtraOptions, info } from '@semo/core'
import { existsSync, readFileSync } from 'node:fs'

export const plugin = 'semo'
export const command = ['list', 'ls']
export const desc = 'List manifest paths and status'

export const builder = function () {}

export const handler = async function (argv: ArgvExtraOptions) {
  const paths = argv.$core.getManifestPaths()

  for (const [label, manifestPath] of Object.entries(paths) as [
    string,
    string,
  ][]) {
    if (existsSync(manifestPath)) {
      try {
        const content = JSON.parse(readFileSync(manifestPath, 'utf8'))
        const count = Object.keys(content.plugins || {}).length
        info(`[${label}] ${manifestPath} (${count} plugins)`)
      } catch {
        info(`[${label}] ${manifestPath} (invalid)`)
      }
    } else {
      info(`[${label}] ${manifestPath} (not found)`)
    }
  }
}
