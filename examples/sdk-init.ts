/**
 * SDK mode example: programmatic initialization without starting Yargs CLI.
 *
 * Run with: tsx examples/sdk-init.ts
 *
 * Demonstrates: skipStdin, custom argv, skipDotEnv
 */

import { Core } from '../packages/core/lib/index.js'

async function main() {
  // Create a Core instance in SDK mode:
  // - skipStdin: don't read stdin (avoids blocking in non-CLI context)
  // - skipDotEnv: skip .env loading
  // - argv: provide custom arguments instead of process.argv
  const core = new Core({
    scriptName: 'sdk-example',
    skipStdin: true,
    skipDotEnv: true,
    argv: ['--env', 'staging', '--verbose'],
  })

  // Lightweight init — loads config and discovers plugins, but does NOT start Yargs
  await core.init()

  // After init(), these properties are available:
  console.log('=== Semo SDK Init Example ===')
  console.log('Version:', core.version)
  console.log('Initialized:', core.initialized)
  console.log('Plugins:', Object.keys(core.allPlugins))
  console.log('Custom argv parsed:', {
    env: core.config('env'),
    verbose: core.config('verbose'),
  })

  // You can invoke hooks programmatically
  const hookResult = await core.invokeHook('status', { mode: 'assign' })
  console.log('Hook result (status):', hookResult)

  // Clean up
  await core.destroy()
  console.log('Initialized after destroy:', core.initialized)

  console.log('=== Done ===')
}

main().catch((err) => {
  console.error('SDK init failed:', err)
  process.exit(1)
})
