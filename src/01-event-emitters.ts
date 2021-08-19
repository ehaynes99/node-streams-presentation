import { EventEmitter } from 'stream'

/**
 * simple demonstration of `EventEmitter`. All streams are
 * `EventEmitters`, but not all `EventEmitters` are streams (as below)
 */
const run = () => {
  const emitter = new EventEmitter()

  emitter.on('eat', (food: string) => {
    if (food === 'brussel sprouts') {
      console.log('Yuck, brussel sprouts')
    } else {
      console.log('Mmmm, ' + food)
    }
  })

  emitter.emit('eat', 'steak')
  emitter.emit('eat', 'potatoes')
  emitter.emit('eat', 'brussel sprouts')

  // can emit anything, whether there are listeners or not
  emitter.emit('tree', 'fall in forest') // no one there to hear it

  // and can register listeners, whether they ever fire that event or not
  emitter.on('nonsense', () => {
    console.log('please call me')
  })
}

const _foo = function () {
  console.log('***** ')
}
run()
