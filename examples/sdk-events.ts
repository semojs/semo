/**
 * SDK events example: lifecycle event monitoring.
 *
 * Run with: tsx examples/sdk-events.ts
 *
 * Demonstrates: init/destroy lifecycle events, hook invocation events
 */

import { Core } from '../packages/core/lib/index.js'

async function main() {
  const core = new Core({
    scriptName: 'sdk-events',
    skipStdin: true,
    skipDotEnv: true,
  })

  console.log('=== Lifecycle Events ===')

  // Monitor init lifecycle
  core.on('init:start', () => console.log('  [event] init:start'))
  core.on('init:env', () =>
    console.log('  [event] init:env - environment ready')
  )
  core.on('init:config', () =>
    console.log('  [event] init:config - configuration loaded')
  )
  core.on('init:done', () =>
    console.log('  [event] init:done - fully initialized')
  )

  // Monitor hook invocations
  core.on('hook:before', (name: string) =>
    console.log(`  [event] hook:before → ${name}`)
  )
  core.on('hook:after', (name: string, result: unknown) => {
    console.log(
      `  [event] hook:after → ${name}`,
      typeof result === 'object' ? JSON.stringify(result) : result
    )
  })
  core.on('hook:error', (name: string, err: unknown, plugin?: string) => {
    const msg = err instanceof Error ? err.message : String(err)
    console.log(
      `  [event] hook:error → ${name} (${plugin || 'unknown'}): ${msg}`
    )
  })

  // Monitor destroy lifecycle
  core.on('destroy:start', () => console.log('  [event] destroy:start'))
  core.on('destroy:done', () => console.log('  [event] destroy:done'))

  console.log('Calling init()...')
  await core.init()

  console.log('\n=== Hook Events ===')

  core.addHook('status', () => ({ uptime: process.uptime() }), 'monitor')
  console.log('Invoking hook...')
  await core.invokeHook('sdk-events:status', { mode: 'assign' })

  console.log('\n=== Error Events (with invokeHookDetailed) ===')
  core.addHook(
    'risky',
    () => {
      throw new Error('something went wrong')
    },
    'risky-plugin'
  )
  const { result, errors } = await core.invokeHookDetailed('sdk-events:risky')
  console.log('Result:', result)
  console.log('Errors collected:', errors.length)

  console.log('\n=== Using once() ===')
  core.once('hook:before', (name: string) =>
    console.log(`  [once] First hook call: ${name}`)
  )

  core.addHook('ping', () => 'pong', 'ping-plugin')
  await core.invokeHook('sdk-events:ping')
  await core.invokeHook('sdk-events:ping') // once listener won't fire again

  console.log('\n=== Destroy ===')
  await core.destroy()

  console.log('\n=== Done ===')
}

main().catch(console.error)
