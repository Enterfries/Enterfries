import test from 'ava'
import sinon from 'sinon'
import log, { niceErrors } from '..'

const stdoutSpy = sinon.spy(process.stdout, 'write')
const stderrSpy = sinon.spy(process.stderr, 'write')


test.beforeEach(t => {
  const time = sinon.useFakeTimers(new Date('2017-12-01T00:00:00.000Z'))
  const logger = log()

  stdoutSpy.reset()
  stderrSpy.reset()

  t.context = {
    logger,
    time,
    stdoutSpy,
    stderrSpy,
  }
})


test('Logging: it should match the expected log output.', t => {
  log.info('foo')

  t.deepEqual(t.context.stdoutSpy.args[0], [
    '{"level":"info","event":"foo","timestamp":"2017-12-01T00:00:00.000Z"}\n',
  ])
})


test('addLevel(): it should use the custom "crazy" level for logging.', t => {
  log.addLevel('crazy', { stream: process.stdout, priority: 3000 })

  log.crazy('foo')

  t.deepEqual(t.context.stdoutSpy.args[0], [
    '{"level":"crazy","event":"foo","timestamp":"2017-12-01T00:00:00.000Z"}\n',
  ])
})


test('singleton: it should use the "crazy" level defined previously', t => {
  log.crazy('foo')

  t.deepEqual(t.context.stdoutSpy.args[0], [
    '{"level":"crazy","event":"foo","timestamp":"2017-12-01T00:00:00.000Z"}\n',
  ])
})


test('addMiddleware(): it should apply the added middleware to the log event', t => {
  log.addMiddleware(event => ({ ...event, hello: 'world' }))
  log.info('foo')

  t.deepEqual(t.context.stdoutSpy.args[0], [
    '{"level":"info","event":"foo","timestamp":"2017-12-01T00:00:00.000Z","hello":"world"}\n',
  ])
})


test('addMiddleware(): it should also apply the middleware in order', t => {
  log.addMiddleware(event => ({ ...event, hello: event.hello.toUpperCase() }))
  log.info('foo')

  t.deepEqual(t.context.stdoutSpy.args[0], [
    '{"level":"info","event":"foo","timestamp":"2017-12-01T00:00:00.000Z","hello":"WORLD"}\n',
  ])
})

test('new instance: it should log with the new logger instance', t => {
  const logger = log()
  logger.info('foo')

  t.deepEqual(t.context.stdoutSpy.args[0], [
    '{"level":"info","event":"foo","timestamp":"2017-12-01T00:00:00.000Z"}\n',
  ])
})


test('priority: it should only log things that are of a lower priority that what it is set to', t => {
  t.context.logger.addLevel('obscene', { stream: process.stdout, priority: 1000 })
  t.context.logger.priority.set('info')

  t.context.logger.obscene('foo')
  t.context.logger.info('foo')

  t.deepEqual(t.context.stdoutSpy.args[0], [
    '{"level":"info","event":"foo","timestamp":"2017-12-01T00:00:00.000Z"}\n',
  ])
})


test('stderr: it should write to stderr for "error" and "fail" levels.', t => {
  t.context.logger.error('foo')
  t.context.logger.fail('foo')

  t.deepEqual(t.context.stderrSpy.args[0], [
    '{"level":"error","event":"foo","timestamp":"2017-12-01T00:00:00.000Z"}\n',
  ])
  t.deepEqual(t.context.stderrSpy.args[1], [
    '{"level":"fail","event":"foo","timestamp":"2017-12-01T00:00:00.000Z"}\n',
  ])
})


test('lock(): it should stop the user calling any of the api methods', t => {
  const lockedLogger = log()

  lockedLogger.lock()

  t.true(lockedLogger.addLevel === undefined)
  t.true(lockedLogger.addMiddleware === undefined)
  t.true(lockedLogger.priority === undefined)
  t.true(lockedLogger.lock === undefined)
})


test('lock(): it should allow the user to create a logging level of "addLevel", for some ungoldy reason, and log with it after calling lock.', t => {
  const lockedLogger = log()

  lockedLogger.addLevel('addLevel', { stream: process.stdout, priority: 5000 })
  lockedLogger.lock()

  lockedLogger.addLevel('Y WOULD U DO DIS!!!')

  t.deepEqual(t.context.stdoutSpy.args[0], [
    '{"level":"addLevel","event":"Y WOULD U DO DIS!!!","timestamp":"2017-12-01T00:00:00.000Z"}\n',
  ])
})


test('Optional Middleware - niceErrors(): it should log errors nicely', t => {
  const logger = log()
  logger.addMiddleware(niceErrors)

  logger.error(new Error('foo'))

  const result = JSON.parse(t.context.stderrSpy.args[0][0])
  t.true(result.event.message !== undefined && result.event.stack !== undefined)
})
