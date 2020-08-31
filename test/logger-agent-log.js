'use strict'

const zlib = require('zlib')
const {test} = require('tap')
const nock = require('nock')
const Logger = require('../lib/logger.js')
const {apiKey, createOptions} = require('./common/index.js')

nock.disableNetConnect()

test('agentLog() success with a /var/log entry', (t) => {
  const line = 'Aug 27 16:41:30 my-machine com.apple.xpc.launchd[1] (com.apple.mdworker.shared.0D000000-0400-0000-0000-000000000000[11142]): '
    + 'Service exited due to SIGKILL | sent by mds[116]'
  const now = Date.now()

  t.plan(2)
  const logger = new Logger(apiKey, createOptions({
    payloadStructure: 'agent'
  }))

  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(logger.url)
    .post('/', (body) => {
      const payload = body.ls[0]
      t.deepEqual(payload, {
        line
      , t: now
      , f: '/var/log/system.log'
      })
      return true
    })
    .query(() => {
      return true
    })
    .reply(200, 'Ingester response')

  logger.on('send', (obj) => {
    t.deepEqual(obj, {
      httpStatus: 200
    , firstLine: line
    , lastLine: null
    , totalLinesSent: 1
    , totalLinesReady: 0
    , bufferCount: 0
    }, 'Got send event')
  })

  logger.agentLog({
    line
  , t: now
  , f: '/var/log/system.log'
  })
})

test('agentLog() success while specifying compression off', (t) => {
  const line = 'Aug 27 16:41:30 my-machine com.apple.xpc.launchd[1] (com.apple.mdworker.shared.0D000000-0400-0000-0000-000000000000[11142]): '
    + 'Service exited due to SIGKILL | sent by mds[116]'
  const now = Date.now()

  t.plan(2)
  const logger = new Logger(apiKey, createOptions({
    payloadStructure: 'agent'
  , compress: false
  }))

  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(logger.url)
    .post('/', (body) => {
      const payload = body.ls[0]
      t.deepEqual(payload, {
        line
      , t: now
      , f: '/var/log/system.log'
      })
      return true
    })
    .query(() => {
      return true
    })
    .reply(200, 'Ingester response')

  logger.on('send', (obj) => {
    t.deepEqual(obj, {
      httpStatus: 200
    , firstLine: line
    , lastLine: null
    , totalLinesSent: 1
    , totalLinesReady: 0
    , bufferCount: 0
    }, 'Got send event')
  })

  logger.agentLog({
    line
  , t: now
  , f: '/var/log/system.log'
  })
})

test('agentLog() success with k8s-style line', (t) => {
  const line = '2020-02-01T05:15:15.000000000-0800 stdout F [200201 05:15:15] [info] {"hello":"world"}'
  const pid = 12345
  const prival = 5
  const label = 'someLabel'
  const now = Date.now()
  const file = '/var/log/containers/blarg_myapp_9e0fc8fb-92a3-451c-aea2-'
    + '9541307d30a2-6c167a350684bb5fe0ff508daea30488d2336164b5407c46ac9866db54ad65e9.log'

  t.plan(2)
  const logger = new Logger(apiKey, createOptions({
    payloadStructure: 'agent'
  }))

  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(logger.url)
    .post('/', (body) => {
      const payload = body.ls[0]
      t.deepEqual(payload, {
        line
      , t: now
      , f: file
      , pid
      , prival
      , label
      })
      return true
    })
    .query(() => {
      return true
    })
    .reply(200, 'Ingester response')

  logger.on('send', (obj) => {
    t.deepEqual(obj, {
      httpStatus: 200
    , firstLine: line
    , lastLine: null
    , totalLinesSent: 1
    , totalLinesReady: 0
    , bufferCount: 0
    }, 'Got send event')
  })

  logger.agentLog({
    line
  , t: now
  , f: file
  , pid
  , prival
  , label
  })
})

test('agentLog() uses gzip compression on the payload', (t) => {
  const line = 'Aug 27 16:41:30 my-machine com.apple.xpc.launchd[1] (com.apple.mdworker.shared.0D000000-0400-0000-0000-000000000000[11142]): '
    + 'Service exited due to SIGKILL | sent by mds[116]'
  const now = Date.now()
  const payload = {
    line
  , t: now
  , f: '/var/log/system.log'
  }

  t.plan(2)
  const logger = new Logger(apiKey, createOptions({
    payloadStructure: 'agent'
  , compress: true
  , flushIntervalMs: 100
  }))

  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(logger.url)
    .post('/', (body) => {
      const deflated = zlib.gunzipSync(Buffer.from(body, 'hex')).toString()
      const parsed = JSON.parse(deflated)
      t.deepEqual(parsed, {
        e: 'ls'
      , ls: [
          payload
        , payload
        , payload
        ]
      }, 'Payload was gzipped correctly')
      return true
    })
    .query(() => {
      return true
    })
    .reply(200, 'Ingester response')

  logger.on('send', (obj) => {
    t.deepEqual(obj, {
      httpStatus: 200
    , firstLine: line
    , lastLine: line
    , totalLinesSent: 3
    , totalLinesReady: 0
    , bufferCount: 0
    }, 'Got send event')
  })

  logger.agentLog(payload)
  logger.agentLog(payload)
  logger.agentLog(payload)
})

test('Error handling: when gzip fails, raw payload is sent instead', (t) => {
  const line = 'Aug 27 16:41:30 my-machine com.apple.xpc.launchd[1] (com.apple.mdworker.shared.0D000000-0400-0000-0000-000000000000[11142]): '
    + 'Service exited due to SIGKILL | sent by mds[116]'
  const now = Date.now()
  const payload = {
    line
  , t: now
  , f: '/var/log/system.log'
  }
  const gzip = zlib.gzip

  t.plan(5)
  const logger = new Logger(apiKey, createOptions({
    payloadStructure: 'agent'
  , compress: true
  , flushIntervalMs: 100
  }))
  const error = new Error('GZIP FAKE FAILURE')

  zlib.gzip = (_, cb) => {
    zlib.gzip = gzip
    setImmediate(cb, error)
  }

  t.on('end', async () => {
    nock.cleanAll()
    zlib.gzip = gzip
  })

  nock(logger.url)
    .post('/', (body) => {
      t.type(body, Object, 'POST body is not a compressed string')
      t.deepEqual(body, {
        e: 'ls'
      , ls: [
          payload
        ]
      }, 'Gzip error caused fallback to original data')
      return true
    })
    .query(() => {
      return true
    })
    .reply(function(uri, requestBody, cb) {
      t.equal(this.req.headers['Content-Encoding'], undefined, 'Gzip header was removed')
      cb(null, [200, 'Ingester Success'])
    })

  logger.on('send', (obj) => {
    t.deepEqual(obj, {
      httpStatus: 200
    , firstLine: line
    , lastLine: null
    , totalLinesSent: 1
    , totalLinesReady: 0
    , bufferCount: 0
    }, 'Got send event')
  })

  logger.on('error', (err) => {
    t.deepEqual(err, {
      name: 'Error'
    , message: 'Error gzipping body'
    , meta: {
        message: 'Will attempt to send data uncompressed'
      , error
      }
    }, 'An error was emitted for the gzip error')
  })

  logger.agentLog(payload)
})

test('.agentLog() rejects lines if payloadStructure is not \'agent\'', (t) => {
  t.plan(2)
  const logger = new Logger(apiKey, createOptions())

  logger.on('error', (err) => {
    t.type(err, Error, 'Expected to be a Error')
    t.match(err, {
      name: 'Error'
    , message: 'Invalid method based on payloadStructure'
    , meta: {
        payloadStructure: 'default'
      , expected: 'agent'
      }
    }, 'Expected Error is correct')
  })
  logger.agentLog('log line')
})

test('.agentLog() warns if line is blank', async (t) => {
  const logger = new Logger(apiKey, createOptions({
    payloadStructure: 'agent'
  }))

  t.test('Completely blank call - no parameters', (tt) => {
    tt.plan(1)

    logger.once('warn', (obj) => {
      tt.deepEqual(obj, {
        message: 'Log statement was empty.  Ignored'
      , statement: null
      }, `Got warning for ${obj.statement}`)
    })
    logger.agentLog()
  })

  t.test('Statement is null', (tt) => {
    tt.plan(1)

    logger.once('warn', (obj) => {
      tt.deepEqual(obj, {
        message: 'Log statement was empty.  Ignored'
      , statement: null
      }, `Got warning for ${obj.statement}`)
    })
    logger.agentLog({
      line: null
    })
  })

  t.test('Statement is undefined', (tt) => {
    tt.plan(1)

    logger.once('warn', (obj) => {
      tt.deepEqual(obj, {
        message: 'Log statement was empty.  Ignored'
      , statement: null
      }, `Got warning for ${obj.statement}`)
    })
    logger.agentLog({
      line: undefined
    })
  })

  t.test('Statement is an empty string', (tt) => {
    tt.plan(1)

    logger.once('warn', (obj) => {
      tt.deepEqual(obj, {
        message: 'Log statement was empty.  Ignored'
      , statement: ''
      }, `Got warning for ${obj.statement}`)
    })
    logger.agentLog({
      line: ''
    })
  })
})
