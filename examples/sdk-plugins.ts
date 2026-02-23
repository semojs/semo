/**
 * SDK plugin lifecycle example: simulating plugin system with lifecycle hooks.
 *
 * Run with: tsx examples/sdk-plugins.ts
 *
 * Demonstrates: hook_plugin_ready, hook_plugin_destroy, plugin lifecycle
 */

import { Core } from '../packages/core/lib/index.js'

async function main() {
  const core = new Core({
    scriptName: 'sdk-plugins',
    skipStdin: true,
    skipDotEnv: true,
  })

  console.log('=== Plugin Lifecycle Example ===')

  // Simulate plugins registering lifecycle hooks before init
  // Use colon namespace syntax to match invokeHook('sdk-plugins:plugin_ready')
  core.addHook(
    'sdk-plugins:plugin_ready',
    (_core) => {
      console.log('[database-plugin] Initialized: connecting to database...')
      return { database: 'connected' }
    },
    'database-plugin'
  )

  core.addHook(
    'sdk-plugins:plugin_ready',
    (_core) => {
      console.log('[cache-plugin] Initialized: warming up cache...')
      return { cache: 'warmed' }
    },
    'cache-plugin'
  )

  core.addHook(
    'sdk-plugins:plugin_destroy',
    () => {
      console.log(
        '[database-plugin] Destroying: closing database connection...'
      )
      return { database: 'closed' }
    },
    'database-plugin'
  )

  core.addHook(
    'sdk-plugins:plugin_destroy',
    () => {
      console.log('[cache-plugin] Destroying: flushing cache...')
      return { cache: 'flushed' }
    },
    'cache-plugin'
  )

  // init() triggers hook_plugin_ready automatically
  console.log('\n--- Calling init() ---')
  await core.init()
  console.log('Init complete.')

  // Use the plugin services
  console.log('\n--- Using plugin services ---')
  core.addHook(
    'sdk-plugins:query',
    () => {
      return { users: ['alice', 'bob'] }
    },
    'database-plugin'
  )

  const queryResult = await core.invokeHook('sdk-plugins:query', {
    mode: 'assign',
  })
  console.log('Query result:', queryResult)

  // destroy() triggers hook_plugin_destroy automatically
  console.log('\n--- Calling destroy() ---')
  await core.destroy()
  console.log('Destroy complete.')

  console.log('\n=== Done ===')
}

main().catch(console.error)
