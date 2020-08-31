# CHANGELOG

This file documents all notable changes in the`LogDNA Node.js logger package`. The release numbering uses [semantic versioning](http://semver.org).

## [1.1.0] - August 31, 2020
### Added
* Added a log method (`agentLog`) intended for LogDNA usage only. This will handle logging from our agent.
* Added gzip compression to support `agentLog`. This should not be used for public consumers
  and is only for the `agentLog` method.

## [1.0.1] - August 26, 2020
### Fixed
* Corrected a broken link ("Best Practices") in docs/migrating-from-older-versions.md

## [1.0.0] - August 25, 2020
### Changed
* Removed `debug` since it's not compatible everywhere.  See
  issue [#89](https://github.com/logdna/nodejs/issues/89)
* `class Logger` forces the use of the `new` keyword
* Helper functions are broken out to declutter the class file
* `Logger` class is no longer exported.  Helper functions should be
  used to instantiate it.
* `cleanUpAll` and `flushAll` functions were removed along with
  callbacks in general.  The class is now an `EventEmitter` instead.
* `configs.js` was renamed to the more appropriate `constants.js`
* Made all variables consistent in naming convention (lowerCamelCase)
* Added EventEmitter for successes, warnings and errors
* Fixed retry logic and possibility for double timers
* Fixed race condition with clearing a single buffer. Now, multiple
  buffers are used so that they can be independently cleared. This
  fixes a race condition where lines that were added during the HTTP
  request could be removed without being sent
* `log()` Options as a string must now be a log level. TypeError if not.
* Properly handles opts.meta, opts.context and this._meta
  according to `indexMeta`
* Removed `sizeof` since it was buggy.  Logic replaced with `.length`
  of the lines
* Added `meta` to the constructor so that it can easily be set without
  needing to call `addMetaProperty` after instantiation.
* Fixed map transitions; No dynamic addition of object properties or
  `delete` usage.
* `ip` can now be an IPv6 address
* Added a loadtest.js test to ensure there is not data loss
* Exponential Backoff with Jitter algorithm implemented for HTTP retries

[1.1.0]: https://github.com/logdna/logger-node/compare/1.0.1...1.1.0
[1.0.1]: https://github.com/logdna/logger-node/compare/1.0.0...1.0.1
[1.0.0]: https://github.com/logdna/logger-node/tree/1.0.0
