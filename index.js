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

module.exports = {
  createLogger
, setupDefaultLogger
}
