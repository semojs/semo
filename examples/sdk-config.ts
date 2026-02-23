/**
 * SDK config example: typed configuration access.
 *
 * Run with: tsx examples/sdk-config.ts
 *
 * Demonstrates: generic config<T>(), layered configuration, getPluginConfig
 */

import { Core } from '../packages/core/lib/index.js'

interface AppSettings {
  port: number
  host: string
  debug: boolean
}

async function main() {
  const core = new Core({
    scriptName: 'sdk-config',
    skipStdin: true,
    skipDotEnv: true,
    argv: ['--port', '3000', '--host', 'localhost', '--debug'],
  })

  await core.init()

  console.log('=== Config Access Example ===')

  // Basic config access
  console.log('Port:', core.config('port'))
  console.log('Host:', core.config('host'))
  console.log('Debug:', core.config('debug'))

  // Generic typed config access
  const port = core.config<number>('port')
  console.log('Typed port (number):', port, typeof port)

  // Default value when key is missing
  const timeout = core.config<number>('timeout', 5000)
  console.log('Timeout (with default):', timeout)

  // Get all config
  const allConfig = core.config()
  console.log(
    'All config keys:',
    Object.keys(allConfig as Record<string, unknown>)
  )

  console.log('\n=== Plugin Config ===')

  // Simulate plugin config via parsedArgv
  core.setParsedArgv({
    ...core.parsedArgv,
    $plugin: {
      'my-service': { apiKey: 'abc123', maxRetries: 3 },
    },
  })

  const apiKey = core.getPluginConfig('apiKey', undefined, 'my-service')
  const maxRetries = core.getPluginConfig('maxRetries', 1, 'my-service')
  console.log('Plugin apiKey:', apiKey)
  console.log('Plugin maxRetries:', maxRetries)

  console.log('\n=== Environment ===')
  console.log('NODE_ENV:', core.getNodeEnv())
  console.log('Is production:', core.isProduction())
  console.log('Is development:', core.isDevelopment())

  await core.destroy()
  console.log('\n=== Done ===')
}

main().catch(console.error)
