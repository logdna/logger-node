<p align="center">
  <a href="https://app.logdna.com">
    <img height="95" width="201" src="https://raw.githubusercontent.com/logdna/artwork/master/logo%2Bnode.png">
  </a>
  <p align="center">Node.js library for logging to <a href="https://logdna.com">LogDNA</a></p>
</p>

[![Coverage Status](https://coveralls.io/repos/github/logdna/logger-node/badge.svg?branch=main)](https://coveralls.io/github/logdna/logger-node?branch=main)
---

* **[Migrating From Other Versions](#migrating-from-other-versions)**
* **[Install](#install)**
* **[Setup](#setup)**
* **[Usage](#usage)**
    * [Logging Errors](#logging-errors)
* **[Default Log Levels](#default-log-levels)**
* **[Custom Log Levels](#custom-log-levels)**
* **[Convenience Methods](#convenience-methods)**
* **[Events](#events)**
    * [addMetaProperty](#event-addMetaProperty)
    * [cleared](#event-cleared)
    * [error](#event-error)
        * [Error while sending to LogDNA](#error-while-sending-to-logdna)
        * [Error while calling `log()`](#error-while-calling-log)
        * [Error due to `payloadStructure` mismatch](#error-due-to-payloadstructure-mismatch)
        * [Error for a `207` (partial success) response](#error-for-a-207-partial-success-response)
    * [removeMetaProperty](#event-removeMetaProperty)
    * [send](#event-send)
    * [warn](#event-warn)
        * [Warnings during `log()`](#warnings-during-log)
        * [Warnings during `agentLog()`](#warnings-during-agentlog)
        * [Warnings during `removeMetaProperty`](#warnings-during-removemetaproperty)
* **[API](#api)**
    * [createLogger](#createloggerkey-options)
    * [setupDefaultLogger](#setupdefaultloggerkey-options)
    * [logger.agentLog](#loggeragentlogopts)
    * [logger.addMetaProperty](#loggeraddmetapropertykey-value)
    * [logger.flush](#loggerflush)
    * [logger.log](#loggerlogstatement-options)
    * [logger.removeMetaProperty](#loggerremovemetapropertykey)
* **[How Log Lines are Sent to LogDNA](#how-log-lines-are-sent-to-logdna)**
* **[Exponential Backoff Strategy](#exponential-backoff-strategy)**
* **[Best Practices](#best-practices)**
* **[Client Side Support](#client-side)**
* **[Bunyan Stream](#bunyan-stream)**
* **[Winston Transport](#winston-transport)**
* **[Using with AWS Lambda](#using-with-aws-lambda)**
* **[Proxy Support](#proxy-support)**
* **[License](#license)**
* **[Contributing](#contributing)**

## Migrating From Other Versions

Previous versions of this client are [still supported](https://github.com/logdna/nodejs), but if you are upgrading to this version, please see
our [migration document](./docs/migrating-from-other-versions.md) for the differences between this version and prior versions.

## Install

```javascript
$ npm install @logdna/logger
```

## Setup

Operation requires a [LogDNA Ingestion Key](https://docs.logdna.com/docs/ingestion-key). Without it, the client will not be able to post
logs to the cloud. Please contact our support if you have questions about this setup process!

## Usage

To use the client, create an instance, then call `.log()` or a [convenience method](#convenience-methods).

```javascript
const logdna = require('@logdna/logger')

const options = {
  app: 'myAppName'
, level: 'debug' // set a default for when level is not provided in function calls
}

const logger = logdna.createLogger('<YOUR INGESTION KEY>', options)

logger.log('This is an INFO statement', 'info')

logger.log('This will be a DEBUG statement, based on the default')

logger.log('This is an INFO statement with an options object', {
  level: 'info'
, meta: {
    somekey: 'Arbitrary message'
  , anotherkey: 'Another arbitrary message or data point'
  }
})

logger.info('This is an INFO statement using a convenience method')

// Objects can be logged, too, but they're just serialized
logger.info({
  message: 'Got some user data'
, userId: req.params.userId // This assumes `req.params` comes from some HTTP framework
})

// Just sets `level: 'error'` automatically
logger.error('An error was encountered while processing user data')
```

### Logging Errors

Although the logger can accept an object as its "message", `Error` instances contain
non-enumerable properties such that `log.error(err)` will not yield the expected results.
To mitigate this, users can trap (or generate) errors, then expose the error properties
as desired.

This example hardcodes some JSON to parse, but it could easily come from user input.

```javascript
const input = '{"whoops": "This JSON is malformed because it\'s missing a closing quote}'
try {
  JSON.parse(input)
} catch (err) {
  log.error('JSON parse error while processing a string that should be JSON', {
    indexMeta: true // Makes `meta` searchable. See docs below.
  , meta: {
      name: err.name
    , message: err.message
    , stack: err.stack
    , input
    }
  })

  // OR, if the all the details aren't important, a more concise log could be this
  log.error(err.message, {
    meta: {
      message: 'JSON parse error during function xxx'
    , input
    }
  })
}
```

## Default Log Levels

The client supports the following log levels by default. They are case-insensitive. Users may also add [custom log levels](#custom-log-levels).

* `TRACE`
* `DEBUG`
* `INFO`
* `WARN`
* `ERROR`
* `FATAL`

## Custom Log Levels

Users may provide an array of `levels` as a logger instantiation option. The `levels`
value must be an array, and its values must be letters only. All level values are
normalized to upper-case when sent to the LogDNA server, but their use in function
calls is case-insensitive.

```js
const {createLogger} = require('@logdna/logger')
const logger = createLogger(myKey, {
  levels: ['info', 'warn', 'critical', 'catastrophic']
})

logger.info('my text') // ok
logger.warn('some warning text') // ok
logger.catastrophic('OH NO!') // error
logger.log('OH NO!', 'critical') // ok
logger.log('We are crashing!', 'catastrophic') // ok
```

## Convenience Methods

We have set up convenience methods that automatically set the log level appropriately, and are easy to read. If using [custom log levels](#custom-log-levels), then convenience methods will
only be added for custom levels that also match the [default log levels](#default-log-levels), e.g. `log.info()`.

### `logger.trace(msg[, options])`
### `logger.debug(msg[, options])`
### `logger.info(msg[, options])`
### `logger.warn(msg[, options])`
### `logger.error(msg[, options])`
### `logger.fatal(msg[, options])`

* `msg` [`<Object>`][] | [`<String>`][] - The message (or object) to log
* `options` [`<Object>`][] - Per-message options. See [`logger.log()`](#loggerlogstatement-options) for those.

## Events

The `Logger` is an `EventEmitter` and will emit events rather than use promises or callbacks to communicate its progress.
Listening to the events is optional, although an `error` listener is recommended.

### Event: `'addMetaProperty'`

* [`<Object>`][]
    * `message` [`<String>`][] - Static message: `'Successfully added meta property'`
    * `key` [`<String>`][] - The added key name
    * `value` [`<String>`][] | [`<Number>`][] | [`<Boolean>`][] | [`<Object>`][] | [`<Array>`][] - The value

Emitted when a meta property is successfully added. This meta property will be attached to each log message.

### Event: `'cleared'`

* [`<Object>`][]
    * `message` [`<String>`][] - A message indicating that everything was sent or that nothing needed to be sent

When all log lines have been sent to LogDNA, this event is emitted. If it emits after lines have successfully been sent,
then the message will be `'All accumulated log entries have been sent'`. If there were no lines to be sent
(for example, if `flush()` was called proactively), then the message will be `'All buffers clear; Nothing to send'`.


### Event: `'error'`

* [`<TypeError>`][] | [`<Error>`][]
    * `message` [`<String>`][] - The error message
    * `meta` [`<Object>`][] - Meta object populated with different information depending on the error

This event is emitted when an asynchronous error is encountered. Depending on the context, `meta` will contain
different pieces of information about the error.  If the error is retry-able, the error's `message`
property will indicate that it's a "temporary" error to avoid confusion with hard errors.

#### Error while sending to LogDNA

**Note:** `ignoreRetryableErrors` is `true` by default, and will not emit errors when
the `retrying` property in the metadata is `true`.  To emit all errors regardless of
`retrying`, set `ignoreRetryableErrors: false`.

The metadata for an error encountered during an HTTP call to LogDNA will have the following `meta` properties in the error.

* `actual` [`<String>`][] - The raw error message from the HTTP client
* `code` [`<String>`][] | [`<Number>`][] - The HTTP agent's "code" or `statusCode` value
* `firstLine` [`<String>`][] - The first log line in the buffer that was sending
* `lastLine` [`<String>`][] - The last log line in the buffer that was sending
* `retrying` [`<Boolean>`][] - Whether an attempt will be made to resend the payload
* `attempts` [`<Number>`][] - The number of consecutive failures

#### Error while calling `log()`

When `log()` is called directly, or indirectly (via a convenience method), errors can be emitted if certain validations fail.
If an invalid log level is provided, or if a bad data type is found for the `options` parameter, the `meta` property of the error
will contain the following properties:

* `got` [`<String>`][] - Description of the invalid input. Will depend on error context.
* `expected` [`<String>`][] - The allowable log levels if `options` is an invalid log level
* `used` [`<String>`][] - If a bad `level` is used in `options`, it will be ignored, and the default will be used.
   This property indicates what that value is.

#### Error due to `payloadStructure` mismatch

When `log()` or `agentLog()` is called, the `payloadStructure` must be set appropriately.  If it is not, an error is emitted.
Keep in mind that `agentLog()` is reserved for LogDNA systems and is not intended for public usage.

* `message` [`<String>`][] - Static message of `Invalid method based on payloadStructure`
* `payloadStructure` [`<String>`][] - The current payload structure value that is set on the instance
* `expected` [`<String>`][] - The expected payload structure to be able to call the method.

#### Error for a `207` (partial success) response

If a `207` status code is received, this means that some of the lines failed to be ingested.  An `error` event is emitted for each
failed line and will have the following structure:

* `message` [`<String>`][] - Static message: `Non-200 status while ingesting this line`
* `meta` [`<Object>`][] - Details about the failed line
    * `statusCode` [`<Number>`][] - The http status code for the failed line
    * `line` [`<String>`][] - The line that failed to be ingested

### Event: `'removeMetaProperty'`

* [`<Object>`][]
    * `message` [`<String>`][] - Static message: `'Successfully removed meta property'`
    * `key` [`<String>`][] - The key that was removed

This is emitted when a key (and implied value) are removed from the global `meta` object. If the key does not exist,
then a [`warn`](#event-warn) event with the same signature will be emitted instead.


### Event: `'send'`

* [`<Object>`][]
    * `httpStatus` [`<String>`][] - The `status` property of the HTTP agent's response
    * `firstLine` [`<String>`][] - The first log line in the buffer that was sent
    * `lastLine` [`<String>`][] - The last log line in the buffer that was sent
    * `totalLinesSent` [`<Number>`][] - The total number of lines in the sent buffer
    * `totalLinesReady` [`<Number>`][] - The number of lines left to be sent (if queueing has happened)
    * `bufferCount` [`<Number>`][] - The number of buffers left to be sent (if queueing has happened)

This event is emitted when a buffer is successfully sent to LogDNA. Since a buffer can contain many log entries, this event summarizes the activity.
In a high throughput system where `flushLimit` is exceeded and multiple buffers are waiting to be sent, information
like `totalLinesReady` and `bufferCount` help illustrate how much work is left to be done. Any buffers that have been queued will
be sent one after another, ignoring any flush timer.


### Event: `'warn'`

* [`<Object>`][]
    * `message` [`<String>`][] - The warn message. Depends on context.

This event is emitted when there is no log data provided to the `log` method, or when `removeMetaProperty` is called with an unrecognized key.
For those cases, additional properties (apart from `message`) are included:

#### Warnings during `log()`

* `statement` (Any) - If `log()` was called with a `null` string or an invalid data type, this key will contain the given log statement.

#### Warnings during `agentLog()`

* `statement` (Any) - If `agentLog()` was called with a `null` string or an invalid data type, this key will contain the given log statement.

#### Warnings during `removeMetaProperty`

* `key` [`<String>`][] - The key that the command attempted to remove but that did not exist

## API

### `createLogger(key[, options])`

* `key` [`<String>`][] - Your [ingestion key](https://docs.logdna.com/docs/ingestion-key)
* `options` [`<Object>`][]
    * `level` [`<String>`][] - [Level](#default-log-levels) to be used if not specified elsewhere. **Default:** `INFO`
    * `levels` [`<Array>`][] - An array of custom log levels to use. **Default:** [Default log levels](#default-log-levels)
    * `tags` [`<Array>`][] | [`<String>`][] - Tags to be added to each message
    * `meta` [`<Object>`][] - Global metadata. Added to each message, unless overridden.
    * `timeout` [`<Number>`][] - Millisecond timeout for each HTTP request. **Default:** `30000`ms. **Max:** `300000`ms
    * `hostname` [`<String>`][] - Hostname for each HTTP request.
    * `mac` [`<String>`][] - MAC address for each HTTP request.
    * `ip` [`<String>`][] - IPv4 or IPv6 address for each HTTP request.
    * `url` [`<String>`][] - URL of the logging server. **Default:** `https://logs.logdna.com/logs/ingest`
    * `flushLimit` [`<Number>`][] - Maximum total line lengths before a `flush` is forced. **Default:** `5000000`
    * `flushIntervalMs` [`<Number>`][] - Mseconds to wait before sending the buffer. **Default:** `250`ms
    * `shimProperties` [`<Array>`][] - List of dynamic `options` keys to look for when calling `log()`
    * `indexMeta` [`<Boolean>`][] - Controls whether `meta` data for each message is searchable. **Default:** `false`
    * `app` [`<String>`][] - Arbitrary app name for labeling each message. **Default:** `default`
    * `env` [`<String>`][] - An environment label attached to each message
    * `baseBackoffMs` [`<Number>`][] - Minimum exponential backoff time in milliseconds. **Default:** `3000`ms
    * `maxBackoffMs` [`<Number>`][] - Maximum exponential backoff time in milliseconds. **Default:** `30000`ms
    * `maxAttempts` [`<Number>`][] - Maximum number of times the logger will try to send a buffer of messages when retryable errors are encountered; when the limit is reached, retryable errors will be treated as non-retryable errors.  **Default:** `-1`, meaning unlimited.
    * `withCredentials` [`<Boolean>`][] - Passed to the request library to make CORS requests. **Default:** `false`
    * `verboseEvents` [`<Boolean>`][] - Include the complete content of the buffer sent when emitting `send` and `error` events.  When this option is enabled, the events will include an additional `buffer` field which is an array of the messages and any metadata associated with those messages that were involved in the transmission that triggered the event.  **Default:** `false`
    * `payloadStructure` [`<String>`][] - (*LogDNA usage only*) Ability to specify a different payload structure for ingestion. **Default:** `default`
    * `compress` [`<Boolean>`][] - (*LogDNA usage only*) Compression support for the agent. **Default:** `false`
    * `proxy` [`<String>`][] - The full URL of an http or https proxy to pass through
    * `ignoreRetryableErrors` [`<Boolean>`][] - Do not emit "errors" that are retry-able. Typically, theses are
      temporary connection-based errors. **Default:** `true`
    * `sendUserAgent` [`<Boolean>`][] - This option controls the sending of our library's user-agent string
      in HTTP requests to LogDNA. When this setting is `true` in a browser context, it may print a console
      error although the payloads are still sent.  Setting this to `false` in a browser context will
      retain the `user-agent` header of the browser. **Default:** `true`
* Throws: [`<TypeError>`][] | [`<TypeError>`][] | [`<Error>`][]
* Returns: `Logger`

Returns a logging instance to use. `flushLimit` and `flushIntervalMs` control when the buffer is sent to LogDNA.
The `flushIntervalMs` timer is only started after lines are logged, and the `flushLimit` is a size approximation based on the summation
of `.length` properties of each log line. If the buffer size exceeds `flushLimit`, it will immediately send the buffer and ignore
the `flushIntervalMs` timer. Otherwise, a timer will repeatedly flush the buffer every `flushIntervalMs` milliseconds,
as long as the buffer contains log entries.

If `indexMeta` is `false`, then the metadata will still appear in LogDNA search, but the fields themselves will not be searchable.
If this option is `true`, then meta objects will be parsed and searchable up to three levels deep. Any fields
deeper than three levels will be stringified and cannot be searched.
**WARNING**: When this option is `true`, your metadata objects across all types of log messages *MUST* have consistent
types, or the metadata object may not be parsed properly!

`shimProperties` can be used to set up keys to look for in the `options` parameter of a `log()` call. If the specified keys
are found in `options`, their key-values will be included the top-level of the final logging payload send to LogDNA.

`payloadStructure` is only for LogDNA's use in other parts of the system such as our logging agent.
It is not intended to be used by public consumers, and it should be left to the default value.

For more information on the backoff algorithm and the options for it, see the [Exponential Backoff Strategy](#exponential-backoff-strategy) section.


### `setupDefaultLogger(key[, options])`

The same as [`createLogger()`](#createloggerkey-options), except for that it creates a singleton that will be reused if called again.
Users can call this multiple times, and the client package will maintain (create and/or return) the singleton.

Note that only the first call will instantiate a new instance. Therefore, any successive calls will ignore the provided parameters.

```javascript
const logdna = require('@logdna/logger')

const logger = logdna.setupDefaultLogger('<YOUR KEY HERE>')
const sameLogger = logdna.setupDefaultLogger()
```

### `logger.agentLog(opts)`

This method is for use exclusively by LogDNA, and is not intended for public logging.

* Emits: [error](#event-error)

### `logger.addMetaProperty(key, value)`

* `key` [`<String>`][] - The meta property's key
* `value` [`<String>`][] | [`<Number>`][] | [`<Boolean>`][] | [`<Object>`][] | [`<Array>`][] - The meta property's value
* Emits: [`addMetaProperty`](#event-addmetaproperty)

This method adds a key-value to the global metadata, which is added to each log entry upon calling `log()`.
Although `meta` can be set on instantiation, this method provides a way to update it on-the-fly.

If `options.meta` is also used in a `log()` call, the key-value pairs from the global `meta` will be merged with
`options.meta`, and those new pairs will take precedence over any matching keys in the global metadata.

```javascript
// This will use `meta` to track logs from different modules
const logger = createLogger('<YOUR API KEY>', {
  meta: {
    module: 'main.js' // Global default
  }
})

logger.debug('This is the main module') // Uses global meta

// ... elsewhere, in another file, perhaps
logger.info('I am in module1.js', {
  meta: {module: __filename} // Overrides global meta
})
```

### `logger.flush()`

* Emits: [`cleared`](#event-cleared)

When `flush` is called, any messages in the buffer are sent to LogDNA. It's not necessary to call this manually, although it is useful
to do so to ensure clean shutdown (see [Best Practices](#best-practices)). When `log` is called, it automatically starts a timer
that will call `flush`, but it is idempotent and can be called at any time.

If log lines exist in the current buffer, it is pushed onto a send queue, and a new buffer is created. The send queue is processed and uploaded to LogDNA.

If no work needs to be done, the `cleared` event is immediately emitted.

### `logger.log(statement[, options])`

* `statement` [`<String>`][] | [`<Object>`][] - Text or object of the log entry. Objects are serialized.
* `options` [`<String>`][] | [`<Object>`][] - A string representing a [level](#default-log-levels) or an object with the following elements:
    * `level` [`<String>`][] - Desired [level](#default-log-levels) for the current message. **Default:** `logger.level`
    * `app` [`<String>`][] - App name to use for the current message. **Default:** `logger.app`
    * `env` [`<String>`][] - Environement name to use for the current message. **Default:** `logger.env`
    * `timestamp` [`<Number>`][] - Epoch ms time to use for the current message. Must be within 24 hours. **Default:** `Date.now()`
    * `context` [`<Object>`][] - Synonym for `meta`, but mutually exclusive. Ignored if `meta` exists.
    * `indexMeta` [`<Boolean>`][] - Allows for the `meta` to be searchable in LogDNA. **Default:** `logger.indexMeta`
    * `meta` [`<Object>`][] - Per-message meta data. Combined with key-values created with `addMetaProperty`
* Emits: [warn](#event-warn), [error](#event-error)

Sends a string or object to LogDNA for storage. If the [convenience methods](#convenience-methods) are used, they call this function
under the hood, so the options are the same. The only difference is that `level` is automatically set in the convenience methods.

### `logger.removeMetaProperty(key)`

* `key` [`<String>`][] - The key (and implied value) to be removed from the global `meta` object.
* Emits: [`warn`](#event-warn)

Attempts to remove the given key from the global `meta` data object. If the key is not found, `warn` is emitted.

## How Log Lines are Sent to LogDNA

In default operation, when `log` functions are called, the line is added to a buffer to cut down on HTTP traffic to the server.
The buffer is flushed every `flushIntervalMs` milliseconds or if the log line lengths grow beyond `flushLimit`.

When `flush` fires (or is called manually), the current buffer is put onto a send queue, and a new buffer is started. The send queue begins
sending to LogDNA. It will continue to send without pausing or honoring `flushIntervalMs` as long as there are buffers in the send queue.
When the send queue is empty, `cleared` is emitted.

### Handling Errors

* If a `207` status code was received, this means that at least one line failed ingestion. Each offending line and its status code
  will be emitted as [an error](#error-for-a-207-partial-success-response).
* User-level errors (such as `400`) will not be retried because they most likely would never be successful (if the message is deemed invalid),
  and `error` events are emitted for these errors, also.
* Connection-based errors or `500`-level response status codes will be retried using an [exponential backoff strategy](#exponential-backoff-strategy), but will
  also emit `error` events along the way.
    * Connection error codes that will retry:
      `ECONNABORTED` (timeout),
      `ECONNRESET`,
      `EADDRINUSE`,
      `ECONNREFUSED`,
      `EPIPE`,
      `ENOTFOUND`,
      `ENETUNREACH`
    * HTTP status codes that will retry:
      `500`,
      `502`,
      `503`,
      `504`,
      `521`,
      `522`,
      `524`

## Exponential Backoff Strategy

When HTTP failures happen, if they are deemed "retryable" (non-user errors), then the client will pause for a short time before
trying to resend. The algorithm it implements is an exponential backoff with a "jitter" strategy that uses random numbers statistically to
spread out the wait times to avoid flooding.

The settings for `baseBackoffMs` and `maxBackoffMs` are used in this algorithm and serve as the lower and upper boundaries for the wait time.

These types of errors are blocking since they are related to timeouts and server errors. Logs will continue to buffer as normal, and
if the HTTP calls becomes successful, they will begin to send immediately, and without pause.

## Best Practices

* The client is optimized for high throughput. Using a single instance is no problem, but multiple instances can be created with the same key if desired.
* Set up an `error` listener so that your app is aware of problems. Things like HTTP errors are emitted this way.
* When shutting down your application, ensure all log entries are flushed by waiting for a final `cleared`
  event during shutdown:

```javascript
const {createLogger} = require('@logdna/logger')
const {once} = require('events')

const logger = createLogger('<YOUR KEY HERE>')

logger.on('error', console.error)

function onSignal(signal) {
  logger.warn({signal}, 'received signal, shutting down')
  shutdown()
}

async function shutdown() {
  await once(logger, 'cleared')
}

process.on('SIGTERM', onSignal)
process.on('SIGINT', onSignal)
```

## Client Side

For logging from a browser, we recommend our [@logdna/browser](https://github.com/logdna/logdna-browser) package which is designed for that purpose.

## Bunyan Stream

For Bunyan Stream support, reference our [logdna-bunyan](https://github.com/logdna/logdna-bunyan/) module.

## Winston Transport

For Winston support, reference our [logdna-winston](https://github.com/logdna/logdna-winston/) module.

## Using with AWS Lambda

AWS Lambda relays `stdout` and `stderr` output from your function's code to CloudWatch,
but you can easily set up a `Logger` instance as shown above to send logs to LogDNA instead.
If you have existing code that uses `console.log` and `console.error` statements, you can
also override these `console` methods to send output to LogDNA without changing your code:

```javascript
'use strict'

const {once} = require('events')
const {createLogger} = require('@logdna/logger')

const options = {
  env: 'env'
, app: 'lambda-app'
, hostname: 'lambda-test'
}
const logger = createLogger('API KEY HERE', options)

// Override console methods to send logs to both LogDNA and stdout/stderr
const {
  log: consoleLog
, error: consoleError
} = console

console.log = function(message, ...args) {
  logger.log(message)
  consoleLog(message, ...args)
}

console.error = function(message, ...args) {
  logger.error(message)
  consoleError(message, ...args)
}

exports.handler = async function handler(event, context) {
  logger.on('error', consoleError)

  // Your code here
  console.log('Informational log')
  console.log({
    example: 'this is a sample object log'
  })
  console.error('Error log')

  // Ensure logs have been flushed to LogDNA before finishing
  await once(logger, 'cleared')
}
```

## Proxy Support

The logger supports proxying for situations such as corporate proxies that require traffic
to be passed through them before reaching the outside world.  For such implementations,
use the [`proxy` instantiation option](#createloggerkey-options) to set the full URL
of the proxy.  It supports both *http* and *https* proxy URLs.  Under the hood, the logger uses
the [https-proxy-agent](https://www.npmjs.com/package/https-proxy-agent) package for this.

In this example, an http proxy (with credentials) is passed through before reaching LogDNA's
secure ingestion endpoint:

```javascript
const {createLogger} = require('@logdna/logger')

const logger = createLogger(apiKey, {
  proxy: 'http://username:pass@yourproxy.company.com:12345'
, app: 'myapp'
})

logger.info('Happy logging through your proxy!')
```

## License

Copyright © [LogDNA](https://logdna.com), released under an MIT license. See the [LICENSE](./LICENSE) file and https://opensource.org/licenses/MIT

*Happy Logging!*

## Contributing

This project is open-sourced, and accepts PRs from the public for bugs or feature
enhancements. These are the guidelines for contributing:

* The project uses [Commitlint][] and enforces [Conventional Commit Standard][]. Please format your commits based on these guidelines.
* An [issue must be opened](https://github.com/logdna/logger-node/issues) in the repository for any bug, feature, or anything else that will have a PR
  * The commit message must reference the issue with an [acceptable action tag](https://github.com/logdna/commitlint-config/blob/41aef3b69f292e39fb41a5ef24bcd7043e0fceb3/index.js#L12-L20) in the commit footer, e.g. `Fixes: #5`


[`<Boolean>`]: https://mdn.io/boolean
[`<Number>`]: https://mdn.io/number
[`<Object>`]: https://mdn.io/object
[`<String>`]: https://mdn.io/string
[`<Array>`]: https://mdn.io/array
[`<TypeError>`]: https://mdn.io/TypeError
[`<RangeError>`]: https://mdn.io/RangeError
[`<Error>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
[Commitlint]: https://commitlint.js.org
[Conventional Commit Standard]: https://www.conventionalcommits.org/en/v1.0.0/

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/darinspivey"><img src="https://avatars.githubusercontent.com/u/1874788?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Darin Spivey</b></sub></a><br /><a href="https://github.com/logdna/logger-node/commits?author=darinspivey" title="Code">💻</a> <a href="https://github.com/logdna/logger-node/commits?author=darinspivey" title="Documentation">📖</a> <a href="#maintenance-darinspivey" title="Maintenance">🚧</a> <a href="https://github.com/logdna/logger-node/commits?author=darinspivey" title="Tests">⚠️</a> <a href="#ideas-darinspivey" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://pxl.blue/"><img src="https://avatars.githubusercontent.com/u/59253100?v=4?s=100" width="100px;" alt=""/><br /><sub><b>relative</b></sub></a><br /><a href="https://github.com/logdna/logger-node/commits?author=relative" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/ligerzero459"><img src="https://avatars.githubusercontent.com/u/1093351?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Ryan Mottley</b></sub></a><br /><a href="#maintenance-ligerzero459" title="Maintenance">🚧</a></td>
    <td align="center"><a href="https://github.com/alanzchen"><img src="https://avatars.githubusercontent.com/u/2144783?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Alan Chen</b></sub></a><br /><a href="https://github.com/logdna/logger-node/commits?author=alanzchen" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/mdeltito"><img src="https://avatars.githubusercontent.com/u/69520?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Mike Del Tito</b></sub></a><br /><a href="https://github.com/logdna/logger-node/commits?author=mdeltito" title="Documentation">📖</a></td>
    <td align="center"><a href="https://www.designveloper.com/vi/"><img src="https://avatars.githubusercontent.com/u/51075198?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Nhut Tran</b></sub></a><br /><a href="https://github.com/logdna/logger-node/commits?author=nhuttm" title="Code">💻</a></td>
    <td align="center"><a href="http://codedependant.net/"><img src="https://avatars.githubusercontent.com/u/148561?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Eric Satterwhite</b></sub></a><br /><a href="https://github.com/logdna/logger-node/commits?author=esatterwhite" title="Documentation">📖</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
