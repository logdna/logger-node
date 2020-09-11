'use strict'

const {test} = require('tap')
const pkg = require('../package.json')
const Logger = require('../lib/logger.js')
const constants = require('../lib/constants.js')
const payloads = require('../lib/payloads.js')
const {apiKey, createOptions} = require('./common/index.js')

test('Exports structure', async (t) => {
  t.type(Logger, Function, 'Logger is a function')
  t.equal(Logger.name, 'Logger', 'Class name is correct')

  const methods = Object.getOwnPropertyNames(Logger.prototype)
  t.equal(methods.length, 15, 'Logger.prototype prop count')
  t.deepEqual(methods, [
    'constructor'
  , 'addMetaProperty'
  , 'agentLog'
  , 'bufferLog'
  , 'flush'
  , '_getSendPayload'
  , 'log'
  , 'removeMetaProperty'
  , 'send'
  , 'trace'
  , 'debug'
  , 'info'
  , 'warn'
  , 'error'
  , 'fatal'
  ], 'Methods names as expected')
})

test('Logger instantiation', async (t) => {
  const log = new Logger(apiKey, createOptions())
  t.equal(log.constructor.name, 'Logger', 'instance returned')
})

test('Logger instance properties', async (t) => {
  t.test('Check Symbol creation and defaults', async (tt) => {
    const log = new Logger(apiKey)
    const propertyVals = {}
    for (const sym of Object.getOwnPropertySymbols(log)) {
      propertyVals[sym.toString()] = log[sym]
    }
    const symbolCount = Object.keys(propertyVals).length
    tt.equal(symbolCount, 13, 'The number of declared symbols', propertyVals)
    const expected = {
      'Symbol(lineLengthTotal)': 0
    , 'Symbol(buffer)': []
    , 'Symbol(meta)': {}
    , 'Symbol(isLoggingBackedOff)': false
    , 'Symbol(attempts)': 0
    , 'Symbol(flusher)': null
    , 'Symbol(readyToSend)': []
    , 'Symbol(isSending)': false
    , 'Symbol(totalLinesReady)': 0
    , 'Symbol(backoffMs)': 3000
    , 'Symbol(payloadStructure)': 'default'
    , 'Symbol(compress)': false
    , 'Symbol(requestDefaults)': {
        auth: {
          username: apiKey
        }
      , agent: Object
      , headers: {
          'Content-Type': 'application/json; charset=UTF-8'
        , 'user-agent': `${pkg.name}/${pkg.version}`
        , 'Authorization': /^Basic \w+/
        }
      , qs: {
          hostname: String
        , mac: undefined
        , ip: undefined
        , tags: undefined
        }
      , timeout: 30000
      , withCredentials: false
      , useHttps: true
      }
    }
    tt.equal(Object.keys(expected).length, symbolCount, 'Each symbol is tested')
    tt.match(propertyVals, expected, 'Symbol property defaults are correct')
  })

  t.test('HTTP agent is assigned correctly based on proxies or not', async (tt) => {
    tt.test('No proxy: https url is used', async (ttt) => {
      const logger = new Logger(apiKey, {
        url: 'https://ingestionserver.com'
      })
      const agent = logger[Symbol.for('requestDefaults')].agent
      const constructorName = Object.getPrototypeOf(agent).constructor.name
      ttt.equal(constructorName, 'HttpsAgent', 'The agent is agentkeepalive.HttpsAgent')
    })

    tt.test('No proxy: http url is used (buyer beware!)', async (ttt) => {
      const logger = new Logger(apiKey, {
        url: 'http://insecureingester.com'
      })
      const agent = logger[Symbol.for('requestDefaults')].agent
      const constructorName = Object.getPrototypeOf(agent).constructor.name
      ttt.equal(constructorName, 'Agent', 'The agent is agentkeepalive.Agent')
    })

    tt.test('Insecure Proxy used: Agent should be HttpsProxyAgent', async (ttt) => {
      const logger = new Logger(apiKey, {
        proxy: 'http://user:pass@yourproxy.com'
      })
      const agent = logger[Symbol.for('requestDefaults')].agent
      const constructorName = Object.getPrototypeOf(agent).constructor.name
      ttt.equal(constructorName, 'HttpsProxyAgent', 'The agent is HttpsProxyAgent')
    })

    tt.test('Secure Proxy used: Agent should be HttpsProxyAgent', async (ttt) => {
      const logger = new Logger(apiKey, {
        proxy: 'https://user:pass@yoursecureproxy.com'
      })
      const agent = logger[Symbol.for('requestDefaults')].agent
      const constructorName = Object.getPrototypeOf(agent).constructor.name
      ttt.equal(constructorName, 'HttpsProxyAgent', 'The agent is HttpsProxyAgent')
    })
  })

  t.test('Check default property values', async (tt) => {
    const log = new Logger(apiKey)
    tt.match(log, {
      flushLimit: 5000000
    , flushIntervalMs: 250
    , baseBackoffMs: 3000
    , maxBackoffMs: 30000
    , indexMeta: false
    , url: 'https://logs.logdna.com/logs/ingest'
    , app: 'default'
    , level: 'INFO'
    , [Symbol.for('requestDefaults')]: {
        userHttps: true
      }
    })
  })

  t.test('Property Overrides with instantiation', async (tt) => {
    const ipv6 = 'fe80::f475:68ff:fefa:42ec%awdl0'
    const options = createOptions({
      baseBackoffMs: 1000
    , maxBackoffMs: 60000
    , flushIntervalMs: 300
    , flushLimit: 400
    , indexMeta: true
    , level: 'dEbUg'
    , timeout: 5000
    , shimProperties: ['one', 'two', 'three']
    , env: 'myEnv'
    , app: 'someAppName'
    , withCredentials: true
    , url: 'http://localhost:80'
    , ip: ipv6
    , meta: {hey: 'there'}
    , hostname: 'bleck'
    , mac: '01:02:03:04:05:06'
    , tags: ['whiz', 'bang', 'done']
    })
    const log = new Logger(apiKey, options)

    const expected = {
      baseBackoffMs: options.baseBackoffMs
    , maxBackoffMs: options.maxBackoffMs
    , flushLimit: options.flushLimit
    , flushIntervalMs: options.flushIntervalMs
    , indexMeta: options.indexMeta
    , level: 'DEBUG'
    , shimProperties: options.shimProperties
    , env: options.env
    , app: options.app
    , url: options.url
    , [Symbol.for('requestDefaults')]: {
        withCredentials: options.withCredentials
      , useHttps: false
      , qs: {
          hostname: options.hostname
        , mac: options.mac
        , ip: ipv6
        , tags: options.tags
        }
      , timeout: options.timeout
      }
    }

    tt.match(log, expected, 'Provided values were used in instantiation')
  })

  t.test('UserAgent passed from a transport is included', async (tt) => {
    const transport = 'logdna-winson/2.3.2'
    const log = new Logger(apiKey, {
      UserAgent: transport
    })
    tt.equal(
      log[Symbol.for('requestDefaults')].headers['user-agent']
    , `${constants.USER_AGENT} (${transport})`
    , 'UserAgent parameter was combined into the user agent header'
    )
  })

  t.test('Tags can be a string', async (tt) => {
    const options = createOptions({
      tags: 'one ,  two,   three  '
    })
    const expected = 'one,two,three'
    const log = new Logger(apiKey, options)
    tt.equal(
      log[Symbol.for('requestDefaults')].qs.tags
    , expected
    , 'Tag string was parsed correctly and set'
    )
  })

  t.test('Tags can be an array', async (tt) => {
    const options = createOptions({
      tags: ['one ', 'two  ', 'three   ']
    })
    const expected = 'one,two,three'
    const log = new Logger(apiKey, options)
    tt.equal(
      log[Symbol.for('requestDefaults')].qs.tags
    , expected
    , 'Tags array was parsed correctly and set'
    )
  })
})

test('Deprecated fields are still allowed and re-assigned', async (t) => {
  t.test('logdna_url is re-assigned to url', async (tt) => {
    const log = new Logger(apiKey, {
      logdna_url: 'http://myhost'
    })
    tt.equal(log.url, 'http://myhost', 'url was set instead')
  })

  t.test('index_meta is re-assigned to indexMeta', async (tt) => {
    const log = new Logger(apiKey, {
      index_meta: true
    })
    tt.equal(log.indexMeta, true, 'indexMeta was set instead')
  })

  t.test('with_credentails is re-assigned to withCredentials', async (tt) => {
    const log = new Logger(apiKey, {
      with_credentials: true
    })
    tt.equal(
      log[Symbol.for('requestDefaults')].withCredentials
    , true
    , 'withCredentials was set instead'
    )
  })
})

test('Instantiation Errors', async (t) => {
  t.test('Auth key is required', async (tt) => {
    tt.throws(() => {
      return new Logger()
    }, {
      message: 'LogDNA Ingestion Key is undefined or not passed as a String'
    , name: 'TypeError'
    }, 'Expected error thrown')
  })

  t.test('Level is a bad value', async (tt) => {
    tt.throws(() => {
      return new Logger(apiKey, {
        level: 'NOPE'
      })
    }, {
      message: 'Invalid level'
    , meta: {
        got: 'NOPE'
      , expectedOneOf: constants.LOG_LEVELS
      }
    }, 'Expected error thrown')
  })

  t.test('Tags is not a string or an array', async (tt) => {
    tt.throws(() => {
      return new Logger(apiKey, {
        tags: {}
      })
    }, {
      message: 'tags should be passed as a String or an Array'
    , name: 'TypeError'
    , meta: {got: {}}
    }, 'Expected error thrown')
  })

  t.test('Meta is not an object', async (tt) => {
    tt.throws(() => {
      return new Logger(apiKey, {
        meta: 'NOPE'
      })
    }, {
      message: 'meta needs to be an object of key-value pairs'
    , name: 'TypeError'
    , meta: {got: 'NOPE'}
    }, 'Expected error thrown')
  })

  t.test('Timeout is not a number', async (tt) => {
    tt.throws(() => {
      return new Logger(apiKey, {
        timeout: 'NOPE'
      })
    }, {
      message: 'timeout must be an Integer'
    , name: 'TypeError'
    , meta: {got: 'NOPE'}
    }, 'Expected error thrown')
  })

  t.test('Timeout is greater than the allowable value', async (tt) => {
    tt.throws(() => {
      return new Logger(apiKey, {
        timeout: constants.MAX_REQUEST_TIMEOUT + 1
      })
    }, {
      message: `timeout cannot be longer than ${constants.MAX_REQUEST_TIMEOUT}`
    }, 'Expected error thrown')
  })

  t.test('Bad hostname', async (tt) => {
    tt.throws(() => {
      return new Logger(apiKey, {
        hostname: 'ws://localhost'
      })
    }, {
      message: 'Invalid hostname'
    }, 'Expected error thrown')
  })

  t.test('Bad MAC address', async (tt) => {
    tt.throws(() => {
      return new Logger(apiKey, {
        mac: 'NOPE'
      })
    }, {
      message: 'Invalid MAC Address format'
    }, 'Expected error thrown')
  })

  t.test('Bad IP address', async (tt) => {
    tt.throws(() => {
      return new Logger(apiKey, {
        ip: 'NOPE'
      })
    }, {
      message: 'Invalid IP Address format'
    }, 'Expected error thrown')
  })

  t.test('Bad Server URL', async (tt) => {
    tt.throws(() => {
      return new Logger(apiKey, {
        url: 'NOPE'
      })
    }, {
      message: 'Invalid URL'
    }, 'Expected error thrown')
  })

  t.test('Bad flushLimit', async (tt) => {
    tt.throws(() => {
      return new Logger(apiKey, {
        flushLimit: 'NOPE'
      })
    }, {
      message: 'flushLimit must be an integer'
    , name: 'TypeError'
    , meta: {
        got: 'NOPE'
      }
    }, 'Expected error thrown')
  })

  t.test('Bad flushIntervalMs', async (tt) => {
    tt.throws(() => {
      return new Logger(apiKey, {
        flushIntervalMs: 'NOPE'
      })
    }, {
      message: 'flushIntervalMs must be an integer'
    , name: 'TypeError'
    , meta: {
        got: 'NOPE'
      }
    }, 'Expected error thrown')
  })

  t.test('Bad baseBackoffMs', async (tt) => {
    tt.throws(() => {
      return new Logger(apiKey, {
        baseBackoffMs: 'NOPE'
      })
    }, {
      message: 'baseBackoffMs must be an integer > 0'
    , name: 'RangeError'
    , meta: {
        got: 'NOPE'
      }
    }, 'Expected error thrown')

    tt.throws(() => {
      return new Logger(apiKey, {
        baseBackoffMs: -1
      })
    }, {
      message: 'baseBackoffMs must be an integer > 0'
    , name: 'RangeError'
    , meta: {
        got: -1
      }
    }, 'Expected error thrown')
  })

  t.test('Bad maxBackoffMs', async (tt) => {
    tt.throws(() => {
      return new Logger(apiKey, {
        maxBackoffMs: 'NOPE'
      , baseBackoffMs: 500
      })
    }, {
      message: 'maxBackoffMs must be an integer > 0 and > baseBackoffMs'
    , name: 'RangeError'
    , meta: {
        got: 'NOPE'
      , baseBackoffMs: 500
      }
    }, 'Expected error thrown')

    tt.throws(() => {
      return new Logger(apiKey, {
        maxBackoffMs: -1
      , baseBackoffMs: 500
      })
    }, {
      message: 'maxBackoffMs must be an integer > 0 and > baseBackoffMs'
    , name: 'RangeError'
    , meta: {
        got: -1
      , baseBackoffMs: 500
      }
    }, 'Expected error thrown')

    tt.throws(() => {
      return new Logger(apiKey, {
        maxBackoffMs: 50
      , baseBackoffMs: 200
      })
    }, {
      message: 'maxBackoffMs must be an integer > 0 and > baseBackoffMs'
    , name: 'RangeError'
    , meta: {
        got: 50
      , baseBackoffMs: 200
      }
    }, 'Expected error thrown')
  })

  t.test('shimProperties must be a non-empty aray', async (tt) => {
    tt.throws(() => {
      return new Logger(apiKey, {
        shimProperties: 'NOPE'
      })
    }, {
      message: 'shimProperties must be a non-empty array'
    , name: 'TypeError'
    , meta: {
        got: 'NOPE'
      }
    }, 'Expected error thrown')

    tt.throws(() => {
      return new Logger(apiKey, {
        shimProperties: []
      })
    }, {
      message: 'shimProperties must be a non-empty array'
    , name: 'TypeError'
    , meta: {
        got: []
      }
    }, 'Expected error thrown')
  })

  t.test('max_length has been removed', async (tt) => {
    tt.throws(() => {
      return new Logger(apiKey, {
        max_length: 100
      })
    }, {
      message: 'Removed.  max_length is no longer an option.'
    }, 'Expected error thrown')
  })

  t.test('app name is too long', async (tt) => {
    const app = 'x'.repeat(constants.MAX_INPUT_LENGTH) + 1
    tt.throws(() => {
      return new Logger(apiKey, {
        app
      })
    }, {
      message: 'app cannot be longer than 80 chars'
    , name: 'TypeError'
    }, 'Expected error thrown')
  })

  t.test('env name is too long', async (tt) => {
    const env = 'x'.repeat(constants.MAX_INPUT_LENGTH) + 1
    tt.throws(() => {
      return new Logger(apiKey, {
        env
      })
    }, {
      message: 'env cannot be longer than 80 chars'
    , name: 'TypeError'
    }, 'Expected error thrown')
  })

  t.test('Bad payloadStructure', async (tt) => {
    tt.throws(() => {
      return new Logger(apiKey, {
        payloadStructure: 'NOPE'
      })
    }, {
      message: 'Invalid payloadStructure value'
    , name: 'TypeError'
    , meta: {
        got: 'NOPE'
      , expected: [...payloads.keys()]
      }
    }, 'Expected error thrown')
  })

  t.test('Compression not available with default payloadStructure', async (tt) => {
    tt.throws(() => {
      return new Logger(apiKey, {
        compress: true
      })
    }, {
      message: 'Compression not available'
    , name: 'Error'
    }, 'Expected error thrown')
  })

  t.test('Bad proxy value', async (tt) => {
    const proxy = 'myproxy.myhost.com:8888'
    tt.throws(() => {
      return new Logger(apiKey, {
        proxy
      })
    }, {
      message: 'proxy value must be a full http or https URL'
    , name: 'TypeError'
    , meta: {
        got: proxy
      }
    }, 'Expected error thrown')
  })
})
