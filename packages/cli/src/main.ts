#!/usr/bin/env node

import { Utils } from '@semo/core'
import path from 'path'

Utils.launchDispatcher({
  coreDir: path.resolve(__dirname, '../'),
  orgMode: true // Means my package publish under npm orgnization scop
})