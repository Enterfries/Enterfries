![Enterfries Logo](https://enterfries.github.io/Enterfries/assets/img/enterfries-logo.svg)

---

# Enterfries / Logger

The Enterfries logger is an extendable logging module specifically designed for
logging to stdout and stderr for consumption by a [Docker Logging
Driver](https://docs.docker.com/engine/admin/logging/overview/).


#### Installation

```bash
npm install --save @enterfries/logger
```


## Usage

Basic usage is:

```javascript
import logger from '@enterfries/logger'

logger.info('Log this!')
// {"level":"info","event":"Log this!","timestamp":"2017-12-01T00:00:00.000Z"}

logger.info('Log this!', 'and this')
// {"level":"info","event":["Log this!","and this"],"timestamp":"2017-12-01T00:00:00.000Z"}
```

Sometimes you might want multiple logging instances with different settings, or
you just don't want to use the singleton. In that case, you can call `logger()`
and store the result which will be a completely fresh instance of a logger.

```javascript
import logger from '@enterfries/logger'

const myLogger = logger()

myLogger.addLevel('debug', { stream: process.stdout, priority: 100 })
myLogger.debug('I am a debug message that works!')

logger.debug('This will not work because this is a different logger instance')
// TypeError: logger.debug is not a function
```


### API

#### `addLevel(level: string, options: Object)`

The `addLevel()` method takes the name of the level as a string, and an options
object with 2 properties: stream (the stream object to call `.write()` on), and
priority (see priorities section for more information on the default
priorities).

```javascript
logger.addLevel('crazy', {
  stream: process.stdout,
  priority: 100,
})

logger.crazy('This is crazy!')
// {"level":"crazy","event":"This is crazy!","timestamp":"2017-12-01T00:00:00.000Z"}
```

#### `addMiddleware(handler: Function)`

`addMiddleware()` allows you to modify the logs in the logger singleton instance
before they are written to stdout/stderr.

It takes a function that will recieve the log event as a JavaScript object and
expects it to return the modified event to continue processing middleware or
before it is stringified and written to the stream.

```javascript
logger.addMiddleware(log => {
  return { ...log, foo: 'bar' }
})

logger.info('Hello, world!')
// {"level":"info","event":"Hello, world!","timestamp":"2017-12-01T00:00:00.000Z","foo":"bar"}
```

#### `lock()`

The `lock()` method on the logging instance, locks the logger to any further
modifications and wipes the public API. It can be used if you don't want any
changes to be made to it, or if for some reason, you want to make a logging
method that is named the same as one of the API methods.

```javascript
logger.addLevel('debug', {
  stream: process.stdout,
  priority: 100,
})

logger.debug('foo')
// {"level":"debug","event":"foo","timestamp":"2017-12-01T00:00:00.000Z"}

logger.lock()

logger.addLevel('crazy', {
  strea: process.stdout,
  priority: 150,
})
// TypeError: logger.addLevel is not a function
```

#### Priority

The priority levels of the logger are, by default, defined as below:

```javascript
logger.addLevel('debug', { stream: process.stdout, priority: 50 })
logger.addLevel('info', { stream: process.stdout, priority: 40 })
logger.addLevel('warn', { stream: process.stdout, priority: 30 })
logger.addLevel('error', { stream: process.stderr, priority: 20 })
logger.addLevel('fail', { stream: process.stderr, priority: 10 })
```

Lower the priority value the higher the assumed severity of the log event is. By
default all log levels are logged, but this can be configured using
`logger.priority.set()` below.


#### Priority: `set(level: string)`

Sets the maximum priority that will be output by the logger.

```javascript
logger.info('this event will be logged')

logger.priority.set('warn')

logger.info('This one will not be logged because "warn" has a lower priority than info')
logger.debug('This one wont be logged either')
logger.error('This will still be logged')
```
