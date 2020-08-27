'use strict'

const defaultPayload = {
  timestamp: undefined
, line: undefined
, level: undefined
, app: undefined
, env: undefined
, meta: undefined
}

const agentPayload = {
  t: undefined
, label: undefined
, line: undefined
, f: undefined
, pid: undefined
, prival: undefined
, containerid: undefined
}

module.exports = new Map([
  ['default', defaultPayload]
, ['agent', agentPayload]
])
