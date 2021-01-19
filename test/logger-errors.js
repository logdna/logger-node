'use strict'

const querystring = require('querystring')
const {test} = require('tap')
const nock = require('nock')
const pkg = require('../package.json')
const Logger = require('../lib/logger.js')
const constants = require('../lib/constants.js')
const {apiKey, createOptions} = require('./common/index.js')

const RETRYABLE_MSG = 'Temporary connection-based error. It will be retried. '
  + 'See meta data for details.'

const NOT_RETRYABLE_MSG = 'A connection-based error occurred that will not be retried. '
  + 'See meta data for details.'

nock.disableNetConnect()

test('Shorthand logging calls require options to be an object', (t) => {
  t.plan(constants.LOG_LEVELS.length)
  const logger = new Logger(apiKey)

  for (const level of constants.LOG_LEVELS) {
    const levelLowerCase = level.toLowerCase()
    const expected = `If passed, log.${levelLowerCase} requires 'options' `
      + 'to be an object'
    t.throws(() => {
      logger[levelLowerCase]('Log line', 'NOPE')
    }, {
      message: expected
    , meta: {got: 'string'}
    , name: 'TypeError'
    }, `log.${levelLowerCase} throws as expected`)
  }
})

test('timestamp validity checks', (t) => {
  t.plan(4)
  const startTime = Date.now()
  const logger = new Logger(apiKey, createOptions({
    flushIntervalMs: 10
  }))

  logger.on('warn', t.fail)
  logger.on('error', t.fail)

  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(logger.url)
    .post('/', (body) => {
      const payload = body.ls
      t.strictEqual(payload.length, 2, 'Number of lines is correct')
      const [{timestamp: stamp1}, {timestamp: stamp2}] = payload
      t.ok(stamp1 > startTime, 'bad time format was replaced with a good one')
      t.ok(stamp2 > startTime, 'out of range time was replaced with a good one')
      return true
    })
    .query(() => { return true })
    .reply(200, 'Ingester response')
    .persist()

  logger.on('send', (obj) => {
    t.deepEqual(obj, {
      httpStatus: 200
    , firstLine: 'my log line'
    , lastLine: 'my log line'
    , totalLinesSent: 2
    , totalLinesReady: 0
    , bufferCount: 0
    }, 'Got send event')
  })

  logger.info('my log line', {
    timestamp: {}
  })
  logger.info('my log line', {
    timestamp: startTime + constants.MS_IN_A_DAY
  })
})

test('.log() throws if options is a string and not a valid log entry', (t) => {
  t.plan(2)
  const logger = new Logger(apiKey, createOptions())

  logger.on('error', (err) => {
    t.type(err, TypeError, 'Expected to be a TypeError')
    t.deepEqual(err, {
      name: 'TypeError'
    , message: 'If \'options\' is a string, then it must be a valid log level'
    , meta: {
        got: 'NOPE'
      , expected: constants.LOG_LEVELS
      }
    }, 'Expected Error is correct')
  })
  logger.log('log line', 'NOPE')
})

test('.log() rejects invalid `opts` data type', (t) => {
  t.plan(2)
  const logger = new Logger(apiKey, createOptions())

  logger.on('error', (err) => {
    t.type(err, TypeError, 'Expected to be a TypeError')
    t.match(err, {
      name: 'TypeError'
    , message: 'options parameter must be a level (string), or object'
    , meta: {
        got: 'number'
      }
    }, 'Expected Error is correct')
  })
  logger.log('log line', 12345)
})

test('.log() passed an invalid log level uses the default instead', (t) => {
  t.plan(3)
  const logger = new Logger(apiKey, createOptions({
    level: 'info'
  }))

  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(logger.url)
    .post('/', (body) => {
      const obj = body.ls[0]
      t.strictEqual(obj.level, 'INFO', 'Default level was used instead')
      return true
    })
    .query(() => { return true })
    .reply(200, 'Ingester response')

  logger.on('error', (err) => {
    t.type(err, Error, 'Expected to be an Error')
    t.deepEqual(err, {
      name: 'Error'
    , message: 'Invalid log level.  Using the default instead.'
    , meta: {
        got: 'NEIGH'
      , expected: constants.LOG_LEVELS
      , used: logger.level
      }
    }, 'Expected Error is correct')
  })
  logger.log('log line', {level: 'NEIGH'})
})

test('.log() ignores empty or null messages', async (t) => {
  const logger = new Logger(apiKey, createOptions())

  t.test('Statement is null', (tt) => {
    tt.plan(1)

    logger.once('warn', (obj) => {
      tt.deepEqual(obj, {
        message: 'Log statement was empty.  Ignored'
      , statement: null
      }, `Got warning for ${obj.statement}`)
    })
    logger.log(null)
  })

  t.test('Statement is undefined', (tt) => {
    tt.plan(1)

    logger.once('warn', (obj) => {
      tt.deepEqual(obj, {
        message: 'Log statement was empty.  Ignored'
      , statement: null
      }, `Got warning for ${obj.statement}`)
    })
    logger.log(undefined)
  })

  t.test('Statement is an empty string', (tt) => {
    tt.plan(1)

    logger.once('warn', (obj) => {
      tt.deepEqual(obj, {
        message: 'Log statement was empty.  Ignored'
      , statement: ''
      }, `Got warning for ${obj.statement}`)
    })
    logger.log('')
  })
})

test('removeMetaProperty emits \'warn\' if property is not found', (t) => {
  t.plan(1)
  const logger = new Logger(apiKey)

  logger.on('removeMetaProperty', t.fail)
  logger.on('warn', (obj) => {
    t.deepEqual(obj, {
      message: 'Property is not an existing meta property.  Cannot remove.'
    , key: 'NOPE'
    }, 'Got expected warning')
  })
  logger.removeMetaProperty('NOPE')
})

test('HTTP timeout will emit Error and continue to retry', (t) => {
  t.plan(10)

  const delay = 1000 // Set this low since nock will ultimately wait to timeout
  const logger = new Logger(apiKey, createOptions({
    baseBackoffMs: 100
  , maxBackoffMs: 500
  , timeout: delay
  , ignoreRetryableErrors: false
  }))
  let attempts = 0

  t.on('end', async () => {
    nock.cleanAll()
  })

  let url // We're strictly asserting the url, so this changes every time

  // Fail 3 times, then succeed. FYI, the axios agent treats a timeout on connection
  // the same as a timeout on response body (connection accepted; no reply)
  nock(logger.url)
    .post('/', () => {
      t.strictEqual(
        logger[Symbol.for('isLoggingBackedOff')]
      , false
      , 'Logger is not backed off prior to the first failure'
      )
      return true
    })
    .query((qs) => {
      url = logger.url + '?' + querystring.stringify(qs)
      return true
    })
    .delayConnection(delay + 1)
    .reply(200, 'Will Not Happen')
    .post('/', () => {
      t.strictEqual(
        logger[Symbol.for('isLoggingBackedOff')]
      , true
      , 'Logger is backed off'
      )
      return true
    })
    .query((qs) => {
      url = logger.url + '?' + querystring.stringify(qs)
      return true
    })
    .delayConnection(delay + 1)
    .reply(200, 'Will Not Happen')
    .post('/', () => { return true })
    .query((qs) => {
      url = logger.url + '?' + querystring.stringify(qs)
      return true
    })
    .delayConnection(delay + 1)
    .reply(200, 'Will Not Happen')
    .post('/', () => { return true })
    .query(() => { return true })
    .reply(200, 'Success')

  const expectedHeaders = {
    'Content-Type': 'application/json; charset=UTF-8'
  , 'user-agent': `${pkg.name}/${pkg.version}`
  }

  logger.on('error', (err) => {
    t.type(err, Error, 'Error type is emitted')
    t.deepEqual(err, {
      message: RETRYABLE_MSG
    , name: 'Error'
    , meta: {
        actual: `timeout of ${delay}ms exceeded`
      , code: 'ECONNABORTED'
      , firstLine: 'This will cause an HTTP timeout'
      , lastLine: null
      , retrying: true
      , attempts: ++attempts
      , headers: expectedHeaders
      , url
      }
    }, `Error properties are correct for attempt ${attempts}`)
  })

  logger.on('cleared', ({message}) => {
    t.strictEqual(message, 'All accumulated log entries have been sent', 'cleared msg')
    t.strictEqual(
      logger[Symbol.for('isLoggingBackedOff')]
    , false
    , 'Logger is not backed off after having a successful connection'
    )
  })

  logger.log('This will cause an HTTP timeout')
})

test('A 500-level statusCode error will continue to retry', (t) => {
  const logger = new Logger(apiKey, createOptions({
    baseBackoffMs: 50
  , maxBackoffMs: 100
  , ignoreRetryableErrors: false
  }))

  const codes = [
    500
  , 502
  , 503
  , 504
  , 521
  , 522
  , 524
  ]

  codes.forEach((code) => {
    t.test(`Testing with statusCode: ${code}`, (tt) => {
      tt.plan(10)
      let attempts = 0

      tt.on('end', async () => {
        nock.cleanAll()
        logger.removeAllListeners()
      })

      // Fail 3 times, then succeed
      nock(logger.url)
        .post('/', () => {
          tt.strictEqual(
            logger[Symbol.for('isLoggingBackedOff')]
          , false
          , 'Logger is not backed off prior to the first failure'
          )
          return true
        })
        .query(() => { return true })
        .reply(code, 'SERVER KABOOM')
        .post('/', () => {
          tt.strictEqual(
            logger[Symbol.for('isLoggingBackedOff')]
          , true
          , 'Logger is backed off'
          )
          return true
        })
        .query(() => { return true })
        .reply(code, 'SERVER KABOOM')
        .post('/', () => { return true })
        .query(() => { return true })
        .reply(code, 'SERVER KABOOM')
        .post('/', () => { return true })
        .query(() => { return true })
        .reply(200, 'Success')

      logger.on('error', (err) => {
        tt.type(err, Error, 'Error type is emitted')
        tt.match(err, {
          message: RETRYABLE_MSG
        , meta: {
            actual: `Request failed with status code ${code}`
          , code
          , firstLine: 'This will cause a server 500ish error'
          , lastLine: null
          , retrying: true
          , attempts: ++attempts
          }
        }, `Error properties are correct for attempt ${attempts}`)
      })

      logger.on('cleared', ({message}) => {
        tt.strictEqual(
          message
        , 'All accumulated log entries have been sent'
        , 'cleared msg'
        )
        tt.strictEqual(
          logger[Symbol.for('isLoggingBackedOff')]
        , false
        , 'Logger is not backed off after having a successful connection'
        )
      })

      logger.log('This will cause a server 500ish error')
    })
  })

  t.end()
})

test('Connection-based error codes trigger a retry', (t) => {
  const logger = new Logger(apiKey, createOptions({
    baseBackoffMs: 50
  , maxBackoffMs: 100
  , ignoreRetryableErrors: false
  }))

  const codes = [
    'ECONNABORTED'
  , 'ECONNRESET'
  , 'EADDRINUSE'
  , 'ECONNREFUSED'
  , 'EPIPE'
  , 'ENOTFOUND'
  , 'ENETUNREACH'
  ]

  codes.forEach((code) => {
    t.test(`Testing with connection error: ${code}`, (tt) => {
      tt.plan(10)
      let attempts = 0

      tt.on('end', async () => {
        nock.cleanAll()
        logger.removeAllListeners()
      })

      // Fail 3 times, then succeed
      nock(logger.url)
        .post('/', () => {
          tt.strictEqual(
            logger[Symbol.for('isLoggingBackedOff')]
          , false
          , 'Logger is not backed off prior to the first failure'
          )
          return true
        })
        .query(() => { return true })
        .replyWithError({code})
        .post('/', () => {
          tt.strictEqual(
            logger[Symbol.for('isLoggingBackedOff')]
          , true
          , 'Logger is backed off'
          )
          return true
        })
        .query(() => { return true })
        .replyWithError({code})
        .post('/', () => { return true })
        .query(() => { return true })
        .replyWithError({code})
        .post('/', () => { return true })
        .query(() => { return true })
        .reply(200, 'Success')

      logger.on('error', (err) => {
        tt.type(err, Error, 'Error type is emitted')
        tt.match(err, {
          message: RETRYABLE_MSG
        , meta: {
            actual: undefined
          , code
          , firstLine: 'This will cause an HTTP connection error'
          , lastLine: null
          , retrying: true
          , attempts: ++attempts
          }
        }, `Error properties are correct for attempt ${attempts}`)
      })

      logger.on('cleared', ({message}) => {
        tt.strictEqual(
          message
        , 'All accumulated log entries have been sent'
        , 'cleared msg'
        )
        tt.strictEqual(
          logger[Symbol.for('isLoggingBackedOff')]
        , false
        , 'Logger is not backed off after having a successful connection'
        )
      })

      logger.log('This will cause an HTTP connection error')
    })
  })

  t.end()
})

test('User-level errors are discarded after emitting an error', (t) => {
  t.plan(10)
  const logger = new Logger(apiKey, createOptions({
    flushLimit: 10 // one message per buffer
  }))

  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(logger.url)
    .post('/', () => {
      t.strictEqual(
        logger[Symbol.for('isLoggingBackedOff')]
      , false
      , 'User errors did not cause logger to back off'
      )
      return true
    })
    .query(() => { return true })
    .reply(400, {
      error: 'Nope, your line was invlalid somehow'
    })
    .persist()

  logger.on('error', (err) => {
    t.type(err, Error, 'Error type is emitted')
    t.match(err, {
      message: NOT_RETRYABLE_MSG
    , meta: {
        actual: 'Request failed with status code 400'
      , code: 400
      , firstLine: /^Something/
      , lastLine: null
      , retrying: false
      , attempts: 1
      }
    }, 'Error properties are correct for a user error')
  })

  logger.on('cleared', ({message}) => {
    t.strictEqual(message, 'All accumulated log entries have been sent', 'cleared msg')
    t.strictEqual(logger[Symbol.for('isSending')], false, 'no longer sending')
    t.strictEqual(logger[Symbol.for('totalLinesReady')], 0, 'no more lines ready')
    t.deepEqual(logger[Symbol.for('readyToSend')], [], 'send buffer is empty')
  })

  logger.log('Something is invalid about this line')
  logger.log('Something else is wrong with this line too')
})

test('.log() rejects lines if payloadStructure is not \'default\'', (t) => {
  t.plan(2)
  const logger = new Logger(apiKey, createOptions({
    payloadStructure: 'agent'
  }))

  logger.on('error', (err) => {
    t.type(err, Error, 'Expected to be a Error')
    t.match(err, {
      name: 'Error'
    , message: 'Invalid method based on payloadStructure'
    , meta: {
        payloadStructure: 'agent'
      , expected: 'default'
      }
    }, 'Expected Error is correct')
  })
  logger.log('log line')
})

test('Retry-able errors are not emitted by default', (t) => {
  const logger = new Logger(apiKey, createOptions({
    flushLimit: 10
  , baseBackoffMs: 50
  , maxBackoffMs: 100
  }))
  const code = 'ECONNABORTED'

  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(logger.url)
    .post('/', () => {
      return true
    })
    .query(() => { return true })
    .replyWithError({code})
    .post('/', () => { return true })
    .query(() => { return true })
    .reply(200, 'Success')

  logger.on('error', (err) => {
    t.fail('Should NOT emit error', err)
  })

  logger.on('cleared', ({message}) => {
    t.strictEqual(message, 'All accumulated log entries have been sent', 'cleared msg')
    t.end()
  })
  logger.log('This is a retryable error, but the event will NOT be emitted')
})
