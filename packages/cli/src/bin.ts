#!/usr/bin/env node

import { Utils } from '@semo/core'
import path from 'path'

Utils.launchDispatcher({
  packageName: '@semo/cli',
  coreDir: path.resolve(__dirname, '../'),
  orgMode: true // Means my package publish under npm orgnization scope
})