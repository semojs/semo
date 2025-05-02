import debug from 'debug'

/**
 * Creates a core debug logger with the given prefix
 * @param prefix The prefix to use for the debug namespace
 * @returns Debug function that logs messages with the core prefix
 */
export const debugCore = (prefix: string) => {
  const coreDebug = debug(`${prefix}:core`)
  return (...rest: unknown[]) => {
    coreDebug(...(rest as [string, ...unknown[]]))
  }
}

/**
 * Creates a core channel debug logger with the given prefix
 * @param prefix The prefix to use for the debug namespace
 * @returns Debug function that logs messages with the core:channel prefix
 */
export const debugCoreChannel = (prefix: string) => {
  return (channel: string, ...rest: unknown[]) => {
    const coreChannelDebug = debug(`${prefix}:core:${channel}`)
    coreChannelDebug(...(rest as [string, ...unknown[]]))
  }
}

/**
 * Creates a channel debug logger with the given prefix
 * @param prefix The prefix to use for the debug namespace
 * @returns Debug function that logs messages with the channel prefix
 */
export const debugChannel = (prefix: string) => {
  return (channel: string, ...rest: unknown[]) => {
    const channelDebug = debug(`${prefix}:${channel}`)
    channelDebug(...(rest as [string, ...unknown[]]))
  }
}
