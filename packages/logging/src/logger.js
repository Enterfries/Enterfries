import createLevelsModule from './levels'
import createMiddlewareModule, {
  addTimestamp,
  flattenEvents,
} from './middleware'


/**
 * Create a new logger.
 */
function createLogger () {
  const loggingLevels = new Map()
  const loggingMiddleware = []
  let locked = false

  const Level = createLevelsModule(loggingLevels)
  const Middleware = createMiddlewareModule(loggingMiddleware)

  // Create the proxy trap. This has to be a callable so that I can use the
  // proxy apply handler to catch function calls.
  const pub = () => { /* noop */ }

  // Add the public methods to the target.
  pub.addLevel = (level, config) => Level.addLevel(level, config)
  pub.addMiddleware = func => Middleware.addMiddleware(loggingMiddleware, func)
  pub.priority = Level.priority
  pub.lock = () => (locked = true)

  return {
    pub,
    applyMiddleware: event => Middleware.applyMiddleware(event),
    getPriority: level => Level.getPriority(level),
    getStream: level => Level.getStream(level),
    hasLevel: level => loggingLevels.has(level),
    isLocked: () => locked,
  }
}


/**
 * Log to the provided stream.
 */
function log (stream, event) {
  const eventStr = JSON.stringify(event)
  stream.write(eventStr + '\n')
}


/**
 * Proxy handler for the logger api
 */
function createHandler (loggerInstance) {
  return {
    get (target, level) {
      if (target[level] !== undefined && !loggerInstance.isLocked()) {
        return target[level]
      }

      if (loggerInstance.hasLevel(level)) {
        return (...event) => {
          if (target.priority.get() >= loggerInstance.getPriority(level)) {
            log(
              loggerInstance.getStream(level),
              loggerInstance.applyMiddleware({ level, event })
            )
          }
        }
      }
    },
    apply (target, _this, [options]) {
      return createLoggerInstance(options)
    },
  }
}


/**
 * Create a public instance of the logger.
 */
function createLoggerInstance (options = {}) {
  const loggerInstance = createLogger()

  const logger = new Proxy(
    loggerInstance.pub,
    createHandler(loggerInstance)
  )

  logger.addLevel('debug', { stream: process.stdout, priority: 50 })
  logger.addLevel('info', { stream: process.stdout, priority: 40 })
  logger.addLevel('warn', { stream: process.stdout, priority: 30 })
  logger.addLevel('error', { stream: process.stderr, priority: 20 })
  logger.addLevel('fail', { stream: process.stderr, priority: 10 })

  logger.addMiddleware(addTimestamp)
  logger.addMiddleware(flattenEvents)

  return logger
}


export default createLoggerInstance()
