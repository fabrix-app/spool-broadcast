# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.6.59](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.58...v1.6.59) (2020-02-11)


### Bug Fixes

* fixes handler ([395a886](https://github.com/fabrix-app/spool-broadcast/commit/395a886))

### [1.6.58](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.57...v1.6.58) (2020-02-11)


### Features

* return promise for runProjector ([d7f6f55](https://github.com/fabrix-app/spool-broadcast/commit/d7f6f55))

### [1.6.57](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.56...v1.6.57) (2020-02-11)


### Features

* adds promises to ack, nack, reject ([8c5ce1a](https://github.com/fabrix-app/spool-broadcast/commit/8c5ce1a))

### [1.6.56](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.55...v1.6.56) (2020-02-11)


### Features

* gracefully interupt ([675199a](https://github.com/fabrix-app/spool-broadcast/commit/675199a))

### [1.6.55](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.54...v1.6.55) (2020-02-10)


### Features

* fix resolves, and catch completely unhandeled eventual errors ([b1e773b](https://github.com/fabrix-app/spool-broadcast/commit/b1e773b))

### [1.6.54](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.53...v1.6.54) (2020-02-10)


### Bug Fixes

* fixes active_broadcasts not getting cleared. ([d9db1f7](https://github.com/fabrix-app/spool-broadcast/commit/d9db1f7))


### Features

* allows eventual processors ([6c15e9b](https://github.com/fabrix-app/spool-broadcast/commit/6c15e9b)), closes [#8](https://github.com/fabrix-app/spool-broadcast/issues/8)

### [1.6.53](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.52...v1.6.53) (2020-02-05)


### Features

* proves that multiple eventual events will run ([aece923](https://github.com/fabrix-app/spool-broadcast/commit/aece923))

### [1.6.52](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.51...v1.6.52) (2020-02-04)


### Features

* adds handeling for wildcards ([a01b0a6](https://github.com/fabrix-app/spool-broadcast/commit/a01b0a6))

### [1.6.51](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.50...v1.6.51) (2020-02-03)


### Features

* adds event ancestors placeholder table. ([d14d403](https://github.com/fabrix-app/spool-broadcast/commit/d14d403))

### [1.6.50](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.49...v1.6.50) (2020-02-02)


### Features

* adds after transaction for subscribers ([471c30b](https://github.com/fabrix-app/spool-broadcast/commit/471c30b))

### [1.6.49](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.48...v1.6.49) (2020-01-30)


### Bug Fixes

* fixes broadcast entity to use correct values ([591b797](https://github.com/fabrix-app/spool-broadcast/commit/591b797))
* make projector and processor run the same way. ([105e342](https://github.com/fabrix-app/spool-broadcast/commit/105e342))

### [1.6.48](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.47...v1.6.48) (2020-01-30)


### Features

* starts readability and metadata reflection ([90c49ab](https://github.com/fabrix-app/spool-broadcast/commit/90c49ab))

### [1.6.47](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.46...v1.6.47) (2020-01-27)


### Bug Fixes

* warns user when using an eventual processor ([0fe94c5](https://github.com/fabrix-app/spool-broadcast/commit/0fe94c5))

### [1.6.46](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.45...v1.6.46) (2020-01-27)


### Features

* adds diagram to readme ([1e8298e](https://github.com/fabrix-app/spool-broadcast/commit/1e8298e))
* adds diagrams ([b407c2a](https://github.com/fabrix-app/spool-broadcast/commit/b407c2a))
* better handle unhandled messages ([83ec422](https://github.com/fabrix-app/spool-broadcast/commit/83ec422))

### [1.6.45](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.44...v1.6.45) (2020-01-23)


### Bug Fixes

* reduces overhead of publish to client by not including `_x` ([b31f72b](https://github.com/fabrix-app/spool-broadcast/commit/b31f72b))

### [1.6.44](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.43...v1.6.44) (2020-01-23)


### Features

* add some warnings to nacking ([01677e2](https://github.com/fabrix-app/spool-broadcast/commit/01677e2))

### [1.6.43](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.42...v1.6.43) (2019-11-06)


### Bug Fixes

* fixes command changes for lists ([6d21738](https://github.com/fabrix-app/spool-broadcast/commit/6d21738))

### [1.6.42](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.41...v1.6.42) (2019-11-06)


### Features

* adds an apply method for change detection ([26f0570](https://github.com/fabrix-app/spool-broadcast/commit/26f0570))

### [1.6.41](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.40...v1.6.41) (2019-11-05)


### Bug Fixes

* don't call toJSON as it can be destructive ([3829e91](https://github.com/fabrix-app/spool-broadcast/commit/3829e91))

### [1.6.40](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.39...v1.6.40) (2019-11-05)


### Features

* add changes for new records ([3bafdf5](https://github.com/fabrix-app/spool-broadcast/commit/3bafdf5))

### [1.6.39](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.38...v1.6.39) (2019-11-05)


### Bug Fixes

* fixes edge case ([86b8b87](https://github.com/fabrix-app/spool-broadcast/commit/86b8b87))

### [1.6.38](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.37...v1.6.38) (2019-11-05)


### Features

* adds applied changes to commands and metadata ([8819971](https://github.com/fabrix-app/spool-broadcast/commit/8819971))

### [1.6.37](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.36...v1.6.37) (2019-11-04)


### Bug Fixes

* fixes maps ([21ce7fb](https://github.com/fabrix-app/spool-broadcast/commit/21ce7fb))

### [1.6.36](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.35...v1.6.36) (2019-11-04)


### Features

* adds channel broadcast ([afb9239](https://github.com/fabrix-app/spool-broadcast/commit/afb9239))

### [1.6.35](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.34...v1.6.35) (2019-11-04)


### Features

* add channelsubscriber table ([b6acecb](https://github.com/fabrix-app/spool-broadcast/commit/b6acecb))

### [1.6.34](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.33...v1.6.34) (2019-11-02)


### Features

* adds event params for arrays and tests pipelines ([4d49b52](https://github.com/fabrix-app/spool-broadcast/commit/4d49b52))

### [1.6.33](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.32...v1.6.33) (2019-10-30)


### Bug Fixes

* fixes response type ([556e7d5](https://github.com/fabrix-app/spool-broadcast/commit/556e7d5))

### [1.6.32](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.31...v1.6.32) (2019-10-30)


### Features

* makes map of command prehooks ([6852d73](https://github.com/fabrix-app/spool-broadcast/commit/6852d73))

### [1.6.31](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.30...v1.6.31) (2019-10-29)


### Bug Fixes

* fixes processRequest merge ([0f820d5](https://github.com/fabrix-app/spool-broadcast/commit/0f820d5))

### [1.6.30](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.29...v1.6.30) (2019-10-29)


### Features

* starts saga ([868202a](https://github.com/fabrix-app/spool-broadcast/commit/868202a))

### [1.6.29](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.28...v1.6.29) (2019-10-29)


### Bug Fixes

* fixes case with n-cases of params ([2953413](https://github.com/fabrix-app/spool-broadcast/commit/2953413))

### [1.6.28](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.27...v1.6.28) (2019-10-29)


### Bug Fixes

* fixes safe event types ([95879c0](https://github.com/fabrix-app/spool-broadcast/commit/95879c0))

### [1.6.27](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.26...v1.6.27) (2019-10-28)


### Bug Fixes

* fixes possible manager mismatching ([f234c78](https://github.com/fabrix-app/spool-broadcast/commit/f234c78))

### [1.6.26](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.25...v1.6.26) (2019-10-28)


### Features

* starts handeling eventual redeliverys ([623cabe](https://github.com/fabrix-app/spool-broadcast/commit/623cabe))

### [1.6.25](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.24...v1.6.25) (2019-10-28)


### Bug Fixes

* fixes publish result ([9917ae9](https://github.com/fabrix-app/spool-broadcast/commit/9917ae9))

### [1.6.24](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.23...v1.6.24) (2019-10-28)


### Features

* adds manager to publisher as well ([377821f](https://github.com/fabrix-app/spool-broadcast/commit/377821f))

### [1.6.23](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.22...v1.6.23) (2019-10-27)


### Bug Fixes

* fixes saga validators ([5881eaa](https://github.com/fabrix-app/spool-broadcast/commit/5881eaa))

### [1.6.22](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.21...v1.6.22) (2019-10-27)


### Features

* adds managers to eventual events and patterns to events ([1fabcaa](https://github.com/fabrix-app/spool-broadcast/commit/1fabcaa))

### [1.6.21](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.20...v1.6.21) (2019-10-26)


### Features

* pattern match on command_type and event_type by default ([1a2c944](https://github.com/fabrix-app/spool-broadcast/commit/1a2c944))

### [1.6.20](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.18...v1.6.20) (2019-10-25)


### Bug Fixes

* fixes multiple managers firing the same publisher event ([bf1b591](https://github.com/fabrix-app/spool-broadcast/commit/bf1b591))


### Features

* adds validator pattern matching for saga ([e360a1f](https://github.com/fabrix-app/spool-broadcast/commit/e360a1f))

### [1.6.19](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.18...v1.6.19) (2019-10-25)

### [1.6.18](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.17...v1.6.18) (2019-10-25)


### Bug Fixes

* fixes broadcastSeries maps ([bad4fd6](https://github.com/fabrix-app/spool-broadcast/commit/bad4fd6))

### [1.6.17](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.16...v1.6.17) (2019-10-25)


### Bug Fixes

* fixes routing of events/commands ([a33ac2b](https://github.com/fabrix-app/spool-broadcast/commit/a33ac2b))

### [1.6.16](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.15...v1.6.16) (2019-10-25)


### Features

* add app extensions to make it easier to reconcile. ([f4a0155](https://github.com/fabrix-app/spool-broadcast/commit/f4a0155))

### [1.6.15](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.14...v1.6.15) (2019-10-24)


### Features

* adds pattern matching to events and commands! ([dbb682f](https://github.com/fabrix-app/spool-broadcast/commit/dbb682f))
* renames libraries to make them easier to distinguish in context ([baed23a](https://github.com/fabrix-app/spool-broadcast/commit/baed23a))

### [1.6.14](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.13...v1.6.14) (2019-10-24)


### Features

* upgrade to sequelize 5 ([98a4083](https://github.com/fabrix-app/spool-broadcast/commit/98a4083))

### [1.6.13](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.12...v1.6.13) (2019-10-23)


### Bug Fixes

* fixes undefined channels ([07c73ce](https://github.com/fabrix-app/spool-broadcast/commit/07c73ce))

### [1.6.12](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.11...v1.6.12) (2019-10-23)


### Features

* starts BroadcastChannel ([b2392da](https://github.com/fabrix-app/spool-broadcast/commit/b2392da))

### [1.6.11](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.10...v1.6.11) (2019-10-18)

### [1.6.10](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.8...v1.6.10) (2019-10-18)


### Features

* adds in spool-realtime ([9180763](https://github.com/fabrix-app/spool-broadcast/commit/9180763))
* adds spool-errors, updates express tests ([4afeb2e](https://github.com/fabrix-app/spool-broadcast/commit/4afeb2e))
* starts realtime intergration ([785b3db](https://github.com/fabrix-app/spool-broadcast/commit/785b3db))

### [1.6.8](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.7...v1.6.8) (2019-09-24)


### Features

* exports extendable models ([edaed7d](https://github.com/fabrix-app/spool-broadcast/commit/edaed7d))

### [1.6.7](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.6...v1.6.7) (2019-09-24)


### Features

* exports interfaces ([7e7302a](https://github.com/fabrix-app/spool-broadcast/commit/7e7302a))

### [1.6.6](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.5...v1.6.6) (2019-09-24)


### Bug Fixes

* **binary:** exports of types ([ae787c2](https://github.com/fabrix-app/spool-broadcast/commit/ae787c2))

### [1.6.5](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.4...v1.6.5) (2019-09-23)


### Features

* uses custom binary type ([4be2ffa](https://github.com/fabrix-app/spool-broadcast/commit/4be2ffa))

### [1.6.4](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.3...v1.6.4) (2019-09-18)

### [1.6.3](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.2...v1.6.3) (2019-09-18)


### Bug Fixes

* fixes export barrel ([0b5c7b7](https://github.com/fabrix-app/spool-broadcast/commit/0b5c7b7))

### [1.6.2](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.1...v1.6.2) (2019-09-17)

### 1.6.1 (2019-09-17)


### Features

* initial commit :fire: ([5024917](https://github.com/fabrix-app/spool-broadcast/commit/5024917))
