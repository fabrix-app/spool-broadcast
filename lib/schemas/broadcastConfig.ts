import joi from '@hapi/joi'

import { processorConfig } from './processorConfig'
import { projectorConfig } from './projectorConfig'
import { hookConfig } from './hookConfig'
import { subscriberConfig } from './subscriberConfig'
import { realtimeConfig } from './realtimeConfig'
import { dispatcherConfig } from './dispatcherConfig'
import { pipeConfig } from './pipeConfig'
// import { channelConfig } from './channelConfig'

export const broadcastConfig = joi.object().keys({
  prefix: joi.string().allow('', null),
  live_mode: joi.boolean().required(),
  auto_save: joi.boolean().required(),
  auto_transaction: joi.boolean().required(),
  profile: joi.string().allow(null).required(),
  enabled: joi.boolean(),
  auto_queue: joi.boolean(),
  default_publish_timeout: joi.number().allow(null).required(),
  // profiles: joi.object().pattern(/^/, joi.array().items(joi.string().regex(/(.+)\.(.+)/))),
  profiles: joi.object().pattern(/^/, joi.array().items(joi.string())),
  exchange_name: joi.string().allow(null),
  connection: joi.object().keys({
    unique: joi.string().allow(null),
    exchange: joi.string().allow(null),
    work_queue_name: joi.string().allow(null),
    interrupt_queue_name: joi.string().allow(null),
    poison_queue_name: joi.string().allow(null),
    host: joi.string().allow(null),
    user: joi.string().allow(null),
    pass: joi.string().allow(null),
    port: joi.number().allow(null),
    vhost: joi.string().allow(null),
    uri: joi.string().allow(null),
    heartbeat: joi.number(),
    timeout: joi.number().allow(null),
    failAfter: joi.number(),
    retryLimit: joi.number()
  }).unknown(),
  broadcasters: joi.object()
    .pattern(joi.string(), [
      joi.object({
        trace: joi.boolean()
      })
    ]),
  projectors: joi.object()
    .pattern(joi.string(), [
      joi.object({
        broadcasters: joi.object()
          .pattern(joi.string(), [
            joi.object()
              .pattern(joi.string(), [
                joi.object()
                  .pattern(joi.string(), [
                    projectorConfig
                  ])
              ])
          ])
      })
    ]),
  processors: joi.object().pattern(joi.string(), [
    joi.object({
      broadcasters: joi.object()
        .pattern(joi.string(), [
          joi.object()
            .pattern(joi.string(), [
              joi.object()
                .pattern(joi.string(), [
                  processorConfig
                ])
            ])
        ])
    })
  ]),
  dispatchers: joi.object().pattern(joi.string(), [
    joi.object({
      broadcasters: joi.object()
        .pattern(joi.string(), [
          joi.object()
            .pattern(joi.string(), [
              joi.object()
                .pattern(joi.string(), [
                  dispatcherConfig
                ])
            ])
        ])
    })
  ]),
  hooks: joi.object().pattern(joi.string(), [
    joi.object({
      broadcasters: joi.object()
        .pattern(joi.string(), [
          joi.object()
            .pattern(joi.string(), [
              joi.object()
                .pattern(joi.string(), [
                  hookConfig
                ])
            ])
        ])
    })
  ]),
  pipelines: joi.object().pattern(joi.string(), [
    joi.object({
      broadcasters: joi.object()
        .pattern(joi.string(), [
          joi.object()
            .pattern(joi.string(), [
              joi.object()
                .pattern(joi.string(), [
                  pipeConfig
                ])
            ])
        ])
    })
  ]),
  channels: joi.object()
  //   .pattern(joi.string(), [
  //   joi.object({
  //     broadcasters: joi.object()
  //       .pattern(joi.string(), [
  //         joi.object()
  //           .pattern(joi.string(), [
  //             joi.object()
  //               .pattern(joi.string(), [
  //                 channelConfig
  //               ])
  //           ])
  //       ])
  //   })
  // ])
})
