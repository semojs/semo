/**
 * SDK hooks example: dynamic hook registration and invocation.
 *
 * Run with: tsx examples/sdk-hooks.ts
 *
 * Demonstrates: addHook, removeHook, invokeHookDetailed, strict mode, context passing
 */

import { Core } from '../packages/core/lib/index.js'
import type { HookHandler } from '../packages/core/lib/index.js'

async function main() {
  const core = new Core({
    scriptName: 'sdk-hooks',
    skipStdin: true,
    skipDotEnv: true,
  })
  await core.init()

  console.log('=== Dynamic Hook Registration ===')

  // Register hooks programmatically (no filesystem needed)
  // Use colon namespace syntax to match invokeHook('sdk-hooks:greet')
  const greetingHandler: HookHandler = (_core, _argv, options) => {
    const name = options.context?.name || 'World'
    return { greeting: `Hello, ${name}!` }
  }
  core.addHook('sdk-hooks:greet', greetingHandler, 'greeting-plugin')

  core.addHook(
    'sdk-hooks:greet',
    () => {
      return { timestamp: new Date().toISOString() }
    },
    'timestamp-plugin'
  )

  // Invoke with context
  const result = await core.invokeHook('sdk-hooks:greet', {
    mode: 'assign',
    context: { name: 'Semo SDK' },
  })
  console.log('Greet result:', result)

  console.log('\n=== Hook Modes ===')

  // Push mode
  core.addHook('sdk-hooks:items', () => 'apple', 'plugin-a')
  core.addHook('sdk-hooks:items', () => 'banana', 'plugin-b')
  const pushResult = await core.invokeHook('sdk-hooks:items', { mode: 'push' })
  console.log('Push mode:', pushResult)

  // Group mode
  core.addHook('sdk-hooks:info', () => ({ version: '1.0' }), 'plugin-a')
  core.addHook('sdk-hooks:info', () => ({ version: '2.0' }), 'plugin-b')
  const groupResult = await core.invokeHook('sdk-hooks:info', { mode: 'group' })
  console.log('Group mode:', groupResult)

  console.log('\n=== invokeHookDetailed ===')

  // Register a failing hook alongside a good one
  core.addHook('sdk-hooks:mixed', () => ({ ok: true }), 'good-plugin')
  core.addHook(
    'sdk-hooks:mixed',
    () => {
      throw new Error('intentional failure')
    },
    'bad-plugin'
  )

  const detailed = await core.invokeHookDetailed('sdk-hooks:mixed')
  console.log('Result:', detailed.result)
  console.log(
    'Errors:',
    detailed.errors.map((e) => `${e.plugin}: ${e.error.message}`)
  )

  console.log('\n=== Strict Mode ===')

  core.addHook(
    'sdk-hooks:strict_test',
    () => {
      throw new Error('strict error')
    },
    'failing-plugin'
  )

  try {
    await core.invokeHook('sdk-hooks:strict_test', { strict: true })
  } catch (err) {
    console.log('Strict mode caught:', (err as Error).message)
  }

  console.log('\n=== Remove Hook ===')

  core.removeHook('greet', 'timestamp-plugin')
  const afterRemove = await core.invokeHook('sdk-hooks:greet', {
    mode: 'assign',
    context: { name: 'After Remove' },
  })
  console.log('After removing timestamp-plugin:', afterRemove)

  await core.destroy()
  console.log('\n=== Done ===')
}

main().catch(console.error)
