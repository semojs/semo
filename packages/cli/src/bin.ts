#!/usr/bin/env node

import { Core } from '@semo/core'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

await new Core({
  packageDirectory: path.resolve(__dirname, '..'),
  packageName: '@semo/cli',
  scriptName: 'semo',
  orgMode: true, // Means my package publish under npm orgnization scope
}).launch()
