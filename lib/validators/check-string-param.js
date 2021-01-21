'use strict'

module.exports = function checkStringParam(param, name) {
  if (!param || typeof param !== 'string') {
    throw new TypeError(`${name} is undefined or not passed as a String`)
  }
}
