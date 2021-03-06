# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.6.103](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.102...v1.6.103) (2020-07-20)


### Bug Fixes

* disallows `null` in types, continues correlation and explain ([a0ed4ca](https://github.com/fabrix-app/spool-broadcast/commit/a0ed4ca))

### [1.6.102](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.100...v1.6.102) (2020-07-20)


### Features

* lays ground work for explain and adds correlation_type ([2ab5438](https://github.com/fabrix-app/spool-broadcast/commit/2ab5438))

### [1.6.100](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.99...v1.6.100) (2020-07-06)


### Features

* log out full message on redelivery ([d900b99](https://github.com/fabrix-app/spool-broadcast/commit/d900b99))

### [1.6.99](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.98...v1.6.99) (2020-06-09)


### Bug Fixes

* only allow keys that have actually changed to be added to previous ([22b698f](https://github.com/fabrix-app/spool-broadcast/commit/22b698f))


### Features

* adds generateEventMetadata for dispatchers ([2d0cd86](https://github.com/fabrix-app/spool-broadcast/commit/2d0cd86))

### [1.6.98](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.97...v1.6.98) (2020-05-29)


### Bug Fixes

* fixes dispatchers event_type patterns ([73868bc](https://github.com/fabrix-app/spool-broadcast/commit/73868bc))

### [1.6.97](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.96...v1.6.97) (2020-05-28)


### Bug Fixes

* fixes dispatchers ([4fb1a04](https://github.com/fabrix-app/spool-broadcast/commit/4fb1a04))

### [1.6.96](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.95...v1.6.96) (2020-05-28)

### [1.6.95](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.94...v1.6.95) (2020-05-15)


### Features

* adds dispatchers ([557b9a1](https://github.com/fabrix-app/spool-broadcast/commit/557b9a1))

### [1.6.94](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.93...v1.6.94) (2020-04-22)


### Bug Fixes

* fixes staging on private objects ([644f4da](https://github.com/fabrix-app/spool-broadcast/commit/644f4da))

### [1.6.93](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.92...v1.6.93) (2020-04-21)


### Features

* always runs before and after stage ([cfc6e37](https://github.com/fabrix-app/spool-broadcast/commit/cfc6e37))

### [1.6.92](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.91...v1.6.92) (2020-04-21)


### Features

* tests distributed ([f399b40](https://github.com/fabrix-app/spool-broadcast/commit/f399b40))

### [1.6.91](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.90...v1.6.91) (2020-04-20)


### Features

* makes less params ([0007109](https://github.com/fabrix-app/spool-broadcast/commit/0007109))

### [1.6.90](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.89...v1.6.90) (2020-04-16)


### Features

* adds synthetic data types ([b78cf8e](https://github.com/fabrix-app/spool-broadcast/commit/b78cf8e))

### [1.6.89](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.88...v1.6.89) (2020-04-13)


### Features

* adds previously to event metadata ([824520c](https://github.com/fabrix-app/spool-broadcast/commit/824520c))

### [1.6.88](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.87...v1.6.88) (2020-04-06)


### Bug Fixes

* fixes deep updatedAt ([6432b31](https://github.com/fabrix-app/spool-broadcast/commit/6432b31))

### [1.6.87](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.86...v1.6.87) (2020-04-06)


### Features

* only applies updatedAt if changes and createdAt if new ([13bc225](https://github.com/fabrix-app/spool-broadcast/commit/13bc225))

### [1.6.86](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.85...v1.6.86) (2020-04-04)


### Bug Fixes

* fixes change logger to return strings on change and only false if fail ([774b592](https://github.com/fabrix-app/spool-broadcast/commit/774b592))

### [1.6.85](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.84...v1.6.85) (2020-04-03)


### Bug Fixes

* fixes saveOptions to only return fields in the object schema ([2cc4965](https://github.com/fabrix-app/spool-broadcast/commit/2cc4965))

### [1.6.84](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.83...v1.6.84) (2020-04-02)


### Features

* adds approveChanges ([09d2a37](https://github.com/fabrix-app/spool-broadcast/commit/09d2a37))
* adds helper to command.apply ([8d1aa4d](https://github.com/fabrix-app/spool-broadcast/commit/8d1aa4d))

### [1.6.83](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.82...v1.6.83) (2020-04-01)


### Features

* updates interfaces ([13a866f](https://github.com/fabrix-app/spool-broadcast/commit/13a866f))

### [1.6.82](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.81...v1.6.82) (2020-04-01)


### Features

* fixes adding the broadcaster to projectors/processors ([82c5840](https://github.com/fabrix-app/spool-broadcast/commit/82c5840))

### [1.6.81](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.80...v1.6.81) (2020-04-01)


### Bug Fixes

* fixes can't use _options really, they should not be read/edited outside ([503427f](https://github.com/fabrix-app/spool-broadcast/commit/503427f))

### [1.6.80](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.79...v1.6.80) (2020-04-01)


### Bug Fixes

* fixes already reloaded data. ([4abbdc9](https://github.com/fabrix-app/spool-broadcast/commit/4abbdc9))

### [1.6.79](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.78...v1.6.79) (2020-03-31)


### Features

* add projection events, and changes ([7d5de0f](https://github.com/fabrix-app/spool-broadcast/commit/7d5de0f))

### [1.6.78](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.77...v1.6.78) (2020-03-25)


### Features

* adds better change detection in command ([c3d1a08](https://github.com/fabrix-app/spool-broadcast/commit/c3d1a08))

### [1.6.77](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.76...v1.6.77) (2020-03-12)


### Bug Fixes

* fixes updated_at ([5eb8ecb](https://github.com/fabrix-app/spool-broadcast/commit/5eb8ecb))
* validates commands ([9e25c85](https://github.com/fabrix-app/spool-broadcast/commit/9e25c85))


### Features

* fixes previous versus change ([7912ba6](https://github.com/fabrix-app/spool-broadcast/commit/7912ba6))
* improves commands and testing ([8687e1a](https://github.com/fabrix-app/spool-broadcast/commit/8687e1a))
* make command easier to reconcile ([4ac4dbd](https://github.com/fabrix-app/spool-broadcast/commit/4ac4dbd))
* makes saga hooks apply changes ([4d3b9ef](https://github.com/fabrix-app/spool-broadcast/commit/4d3b9ef))
* makes the command not call toJSON ([d93a216](https://github.com/fabrix-app/spool-broadcast/commit/d93a216))
* records changes to data, fixes apply ([30f8d17](https://github.com/fabrix-app/spool-broadcast/commit/30f8d17))
* removes no longer needed warning ([8c4bdde](https://github.com/fabrix-app/spool-broadcast/commit/8c4bdde)), closes [#8](https://github.com/fabrix-app/spool-broadcast/issues/8)
* removes ugly sequelize hack ([ab4949e](https://github.com/fabrix-app/spool-broadcast/commit/ab4949e))
* updates "prehooks" to "hooks" to better describe them as saga hooks ([e772447](https://github.com/fabrix-app/spool-broadcast/commit/e772447))

### [1.6.76](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.75...v1.6.76) (2020-03-05)


### Features

* makes zipping more rational ([8c37f59](https://github.com/fabrix-app/spool-broadcast/commit/8c37f59))

### [1.6.75](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.74...v1.6.75) (2020-03-05)


### Bug Fixes

* fixes stupid error ([62fe459](https://github.com/fabrix-app/spool-broadcast/commit/62fe459))

### [1.6.74](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.73...v1.6.74) (2020-03-05)

### [1.6.73](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.72...v1.6.73) (2020-03-04)

### [1.6.72](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.71...v1.6.72) (2020-03-04)


### Features

* adds pipeline to options and emits steps as subprogress ([a6b2179](https://github.com/fabrix-app/spool-broadcast/commit/a6b2179))

### [1.6.71](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.70...v1.6.71) (2020-03-04)


### Bug Fixes

* fixes children traces when disabled, adds multi broadcaster test starter ([3d96aea](https://github.com/fabrix-app/spool-broadcast/commit/3d96aea))

### [1.6.70](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.69...v1.6.70) (2020-03-04)


### Features

* disable tracers by default ([b6dfdaa](https://github.com/fabrix-app/spool-broadcast/commit/b6dfdaa))
* uses bluebird from new Promises ([ae4fcae](https://github.com/fabrix-app/spool-broadcast/commit/ae4fcae))

### [1.6.69](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.68...v1.6.69) (2020-03-02)


### Features

* acttually unnest children ([d3b6021](https://github.com/fabrix-app/spool-broadcast/commit/d3b6021))

### [1.6.68](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.67...v1.6.68) (2020-03-02)


### Features

* better logging for tracer ([a2ed99d](https://github.com/fabrix-app/spool-broadcast/commit/a2ed99d))

### [1.6.67](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.66...v1.6.67) (2020-03-02)


### Features

* adds tracer ([77a3886](https://github.com/fabrix-app/spool-broadcast/commit/77a3886))

### [1.6.66](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.64...v1.6.66) (2020-02-24)


### Features

* adds app version to db ([c983996](https://github.com/fabrix-app/spool-broadcast/commit/c983996))

### [1.6.64](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.63...v1.6.64) (2020-02-19)


### Features

* adds reloads to resolvers, and starts moving data, metadata handlers ([bfd0068](https://github.com/fabrix-app/spool-broadcast/commit/bfd0068))

### [1.6.63](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.62...v1.6.63) (2020-02-15)


### Features

* adds multi version joi validator ([2bb26a2](https://github.com/fabrix-app/spool-broadcast/commit/2bb26a2))

### [1.6.62](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.61...v1.6.62) (2020-02-14)


### Features

* upgrades to @hapi/joi ([983764a](https://github.com/fabrix-app/spool-broadcast/commit/983764a))

### [1.6.61](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.60...v1.6.61) (2020-02-14)


### Bug Fixes

* ensures commands validators are fully compliant javascript objects ([cdf62a2](https://github.com/fabrix-app/spool-broadcast/commit/cdf62a2))

### [1.6.60](https://github.com/fabrix-app/spool-broadcast/compare/v1.6.59...v1.6.60) (2020-02-11)


### Features

* runs eventual events correctly as single message entities. ([f842910](https://github.com/fabrix-app/spool-broadcast/commit/f842910))

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
