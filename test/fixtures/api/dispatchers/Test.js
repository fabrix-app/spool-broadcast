const Dispatcher = require('../../../../dist').BroadcastDispatcher
const Dispatch = require('../../../../dist').BroadcastDispatch

class SomethingElse extends Dispatch {
  async run() {
    //
    const newEvent = this.generateEvent('test.something.else')

    console.log('DISPATCHING', this.manager, newEvent)
    return this.broadcast(newEvent)
      .then(([event, options]) => {
        console.log('DISPATCHED', event)
        return [event, options]
      })
  }
}

class MultiSomethingElse extends Dispatch {
  async run() {
    //
    const newEvent = this.generateEvent('test.something.else')
    const newEvent2 = this.generateEvent('test.something.else.2')

    console.log('DISPATCHING MULTI', this.manager)
    return this.broadcast([newEvent, newEvent2])
      .then((res) => {
        console.log('DISPATCHED MULTI', res)
        return res
      })
  }
}


module.exports = class Test extends Dispatcher {
  somethingElse(args) {
    return new SomethingElse(this.app, args)
  }
  multiSomethingElse(args) {
    return new MultiSomethingElse(this.app, args)
  }
}
