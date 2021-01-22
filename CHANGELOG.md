# 2021-01-22, Version 2.2.1 (Stable)

* [[26600d6d94](https://github.com/logdna/logger-node/commit/26600d6d94)] - fix: Remove length validation for instantiation options (Darin Spivey)
* [[bff4b95e17](https://github.com/logdna/logger-node/commit/bff4b95e17)] - fix: tests should not use `match` for Symbols (Darin Spivey)
* [[7d93f15a5c](https://github.com/logdna/logger-node/commit/7d93f15a5c)] - fix: tags array values must be converted to a string (Darin Spivey)

# 2021-01-19, Version 2.2.0 (Stable)

* [[c84b073d95](https://github.com/logdna/logger-node/commit/c84b073d95)] - deps: eslint-config-logdna@4.0.2 (Darin Spivey)
* [[5be9d49bfc](https://github.com/logdna/logger-node/commit/5be9d49bfc)] - **(SEMVER-MINOR)** feat: Add more context (headers) to the errors (Darin Spivey)

# 2021-01-05, Version 2.1.3 (Stable)

* [[a5caa19ba0](https://github.com/logdna/logger-node/commit/a5caa19ba0)] - package: bump to axios@0.21.1 (Tran Minh Nhut)

# 2020-12-17, Version 2.1.2 (Stable)

* [[4b012a8835](https://github.com/logdna/logger-node/commit/4b012a8835)] - fix(docs): update example of using Logger on AWS Lambda (Mike Del Tito)

# 2020-11-20, Version 2.1.1 (Stable)

* [[41f5dc525e](https://github.com/logdna/logger-node/commit/41f5dc525e)] - fix: Add `sendUserAgent` to `types.d.ts` (Alan Chen)

# 2020-11-04, Version 2.1.0 (Stable)

* [[99c12195a3](https://github.com/logdna/logger-node/commit/99c12195a3)] - **(SEMVER-MINOR)** fix: Omit user-agent header if `sendUserAgent` option is `false` (Darin Spivey) [LOG-7793](https://logdna.atlassian.net/browse/LOG-7793)

# 2020-10-28, Version 2.0.1 (Stable)

* [[003584ac29](https://github.com/logdna/logger-node/commit/003584ac29)] - fix: add PR validation to Jenkinsfile (Ryan Mottley) [LOG-7716](https://logdna.atlassian.net/browse/LOG-7716)

# 2020-10-20, Version 2.0.0 (Stable)

* [[c99d8b5169](https://github.com/logdna/logger-node/commit/c99d8b5169)] - **(SEMVER-MAJOR)** feat: `ignoreRetryableErrors` will not emit retry-able errors (Darin Spivey) [LOG-7639](https://logdna.atlassian.net/browse/LOG-7639)

# 2020-10-16, Version 1.3.3 (Stable)

* [[18f03a8d5e](https://github.com/logdna/logger-node/commit/18f03a8d5e)] - deps: Switch to eslint-config-logdna (Darin Spivey) [LOG-7630](https://logdna.atlassian.net/browse/LOG-7630)
* [[23ae74ce3b](https://github.com/logdna/logger-node/commit/23ae74ce3b)] - fix: Add .npmignore (Darin Spivey) [LOG-7630](https://logdna.atlassian.net/browse/LOG-7630)
* [[21747f898b](https://github.com/logdna/logger-node/commit/21747f898b)] - fix: Move from CircleCI to Jenkins for CI (Darin Spivey) [LOG-7630](https://logdna.atlassian.net/browse/LOG-7630)
* [[c9dacac6a8](https://github.com/logdna/logger-node/commit/c9dacac6a8)] - package: bump to @logdna/logger@1.3.2 (Darin Spivey)

# CHANGELOG

This file documents all notable changes in the`LogDNA Node.js logger package`. The release numbering uses [semantic versioning](http://semver.org).

## [1.3.2] - September 14, 2020
### Fixed
* Removed `eslint` as an unnecessary `peerDependency`.  It can be in `devDependencies` only.

## [1.3.1] - September 9, 2020
### Fixed
* The Typescript definition needed to extend EventEmitter
* Fixed the default timeout to be 30 seconds instead of 5 seconds.

## [1.3.0] - September 9, 2020
### Fixed
* Corrected the module name in the Typescript definition

### Added
* Proxy support for either http or https proxy server URLs
* Husky and commitlint to help enforce conventional commit style

## [1.2.0] - September 2, 2020
### Added
* Added additional error codes and statuses that trigger HTTP retries
* Added support for a `207` (partial success) response.  Lines which errored will emit an `error` event.

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

[1.3.2]: https://github.com/logdna/logger-node/compare/1.3.1...1.3.2
[1.3.1]: https://github.com/logdna/logger-node/compare/1.3.0...1.3.1
[1.3.0]: https://github.com/logdna/logger-node/compare/1.2.0...1.3.0
[1.2.0]: https://github.com/logdna/logger-node/compare/1.1.0...1.2.0
[1.1.0]: https://github.com/logdna/logger-node/compare/1.0.1...1.1.0
[1.0.1]: https://github.com/logdna/logger-node/compare/1.0.0...1.0.1
[1.0.0]: https://github.com/logdna/logger-node/tree/1.0.0
