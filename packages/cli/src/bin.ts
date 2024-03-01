#!/usr/bin/env node

import { Utils } from '@semo/core'
import path from 'path'

Utils.launchDispatcher({
  packageDirectory: path.resolve(__dirname, '..'),
  packageName: '@semo/cli',
  scriptName: 'semo',
  orgMode: true, // Means my package publish under npm orgnization scope
})
