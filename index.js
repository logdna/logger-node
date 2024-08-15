'use strict'

const Logger = require('./lib/logger.js')

let singleton

function setupDefaultLogger(key, opts) {
  if (singleton) return singleton
  singleton = new Logger(key, opts)
  return singleton
}

function createLogger(key, options) {
  return new Logger(key, options)
}

const LogLevel = {
  trace: 'TRACE'
, debug: 'DEBUG'
, info: 'INFO'
, warn: 'WARN'
, error: 'ERROR'
, fatal: 'FATAL'
}

module.exports = {
  createLogger
, setupDefaultLogger
, LogLevel
}
