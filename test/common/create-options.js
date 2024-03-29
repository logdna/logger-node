'use strict'

module.exports = function createOptions({
  key = '< YOUR INGESTION KEY HERE >'
, hostname = 'AWESOMEHOSTER'
, ip = '10.0.1.101'
, mac = 'C0:FF:EE:C0:FF:EE'
, app = 'testing.log'
, test = true
, port = 1337
, flushIntervalMs = 1 // Immediate flushing should be the default
, flushLimit = null
, indexMeta = null
, level = undefined
, tags = null
, timeout = null
, shimProperties
, env = undefined
, withCredentials = null
, url = `https://localhost:${port}`
, baseBackoffMs = undefined
, maxBackoffMs = undefined
, meta = undefined
, payloadStructure = undefined
, compress = undefined
, proxy = undefined
, ignoreRetryableErrors = undefined
, sendUserAgent = undefined
, maxAttempts = undefined
, verboseEvents = undefined
} = {}) {
  return {
    key
  , hostname
  , ip
  , mac
  , app
  , test
  , url
  , flushIntervalMs
  , flushLimit
  , indexMeta
  , level
  , tags
  , timeout
  , shimProperties
  , env
  , withCredentials
  , baseBackoffMs
  , maxBackoffMs
  , meta
  , payloadStructure
  , compress
  , proxy
  , ignoreRetryableErrors
  , sendUserAgent
  , maxAttempts
  , verboseEvents
  }
}
