/**
 * Cart Configuration
 *
 * @see {@link https://github.com/CaliStyle/spool-cart}
 */
export const broadcast = {
  prefix: null,
  live_mode: true,
  auto_save: false,
  // If every entry should chain transactions
  auto_transaction: false,
  profile: process.env.BROADCAST_PROFILE || null,
  enabled: true,
  auto_queue: true,

  // ms before publish timeout
  default_publish_timeout: null,

  connection: {
    // optional, defaults to `broadcasts-work-x`
    exchange: process.env.BROADCAST_EXCHANGE || null,
    // optional, defaults to `broadcasts-work-q`
    work_queue_name: process.env.BROADCAST_WORK_QUEUE || null,
    // optional, defaults to `broadcasts-interrupt-q`
    interrupt_queue_name: process.env.BROADCAST_INTERRUPT_QUEUE || null,

    /**
     * The RabbitMQ connection information.
     * See: https://www.rabbitmq.com/uri-spec.html
     */
    host: process.env.BROADCAST_RMQ_HOST || null,
    user: process.env.BROADCAST_RMQ_USER || null,
    pass: process.env.BROADCAST_RMQ_PASS || null,
    port: process.env.BROADCAST_RMQ_PORT || null,
    vhost: process.env.BROADCAST_RMQ_VHOST || null,

    /**
     * Connection information could also be passed via uri
     */
    uri: process.env.BROADCAST_RMQ_URI || null,

    /**
     * Additional, optional connection options (default values shown)
     */
    heartbeat: 30,
    timeout: null, // this is the connection timeout (in milliseconds, per connection attempt), and there is no default
    failAfter: 60, // limits how long rabbot will attempt to connect (in seconds, across all connection attempts). Defaults to 60
    retryLimit: 3, // limits number of consecutive failed attempts
  },
  profiles: {},
  projectors: {},
  processors: {},
  hooks: {}
}
