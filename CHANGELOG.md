## Changelog

## [2.4.1](https://github.com/logdna/logger-node/compare/v2.4.0...v2.4.1) (2021-09-23)


### Bug Fixes

* **package**: Include missing files and type definitions [4a52274](https://github.com/logdna/logger-node/commit/4a52274709166458abc65bf7531c8fbb1abbb4dd) - Darin Spivey, closes: [#55](https://github.com/logdna/logger-node/issues/55)

# [2.4.0](https://github.com/logdna/logger-node/compare/v2.3.2...v2.4.0) (2021-09-08)


### Chores

* **deps**: Upgrade linting, tap and other deps [d6e6458](https://github.com/logdna/logger-node/commit/d6e6458903a4a60700c7d469bb8c731a629a6d4e) - Darin Spivey


### Features

* **levels**: Support custom log levels [0324293](https://github.com/logdna/logger-node/commit/0324293c0191c6050e93cf459bddd80a34fda939) - Darin Spivey

## [2.3.2](https://github.com/logdna/logger-node/compare/v2.3.1...v2.3.2) (2021-04-13)


### Bug Fixes

* **docs**: Correct bad documentation for logging errors [0606986](https://github.com/logdna/logger-node/commit/06069863460194470ad80a8aaa89fdc8fb805104) - Darin Spivey


### Chores

* **contributors**: Use all-contributors [78d997f](https://github.com/logdna/logger-node/commit/78d997f57694c3e791593014e21bb46665233430) - Darin Spivey
* **deps**: Remove unnecessary eslint plugins [1141c8d](https://github.com/logdna/logger-node/commit/1141c8db01e143114420f8e002770ca7f783c8ed) - Darin Spivey


### Continuous Integration

* Switch to using semantic-release [b1fa6ca](https://github.com/logdna/logger-node/commit/b1fa6cabf902032774cc814a8f6d3fd071bce3a0) - Darin Spivey


### Miscellaneous

* add @alanzchen as a contributor [61600f3](https://github.com/logdna/logger-node/commit/61600f377a5817e4d8c079d56d9eb36ccb6e69ef) - Darin Spivey
* add @darinspivey as a contributor [af54268](https://github.com/logdna/logger-node/commit/af54268f7fb373f1d4785df7d2f06ad023ae609c) - Darin Spivey
* add @esatterwhite as a contributor [6c8807f](https://github.com/logdna/logger-node/commit/6c8807f91d5369f287d8b523f6a25e63960b8104) - Darin Spivey
* add @ligerzero459 as a contributor [9bdeac8](https://github.com/logdna/logger-node/commit/9bdeac876015e91d09d3bf2d6be203fe20dd6e6f) - Darin Spivey
* add @mdeltito as a contributor [369e1ac](https://github.com/logdna/logger-node/commit/369e1ac165f7e0d7d257eef5b07f3d5389c70dd3) - Darin Spivey
* add @nhuttm as a contributor [e8e63c2](https://github.com/logdna/logger-node/commit/e8e63c22d679b5b3f927e98e28ab2b2bddd12e9e) - Darin Spivey
* add @relative as a contributor [50c9050](https://github.com/logdna/logger-node/commit/50c9050cbb22a88d9122eac7c2cdd20a3a007c21) - Darin Spivey

# 2021-03-22, Version 2.3.1 (Stable)

* [[2cda1aac84](https://github.com/logdna/logger-node/commit/2cda1aac84)] - fix: Turn off maxBodyLength in Axios (Darin Spivey)

# 2021-03-15, Version 2.3.0 (Stable)

* [[ba40b6948a](https://github.com/logdna/logger-node/commit/ba40b6948a)] - **(SEMVER-MINOR)** feat: Add EADDRNOTAVAIL to the retryable error codes (Darin Spivey)

# 2021-02-09, Version 2.2.4 (Stable)

* [[ed7835a5d6](https://github.com/logdna/logger-node/commit/ed7835a5d6)] - fix: Move branch name from master to main (Darin Spivey)

# 2021-02-05, Version 2.2.3 (Stable)

* [[a0f141bfaa](https://github.com/logdna/logger-node/commit/a0f141bfaa)] - doc: add contribution guides (Eric Satterwhite)

# 2021-01-27, Version 2.2.2 (Stable)

* [[e8df8ad569](https://github.com/logdna/logger-node/commit/e8df8ad569)] - fix: Remove invalid characters from the user-agent (Darin Spivey)

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
