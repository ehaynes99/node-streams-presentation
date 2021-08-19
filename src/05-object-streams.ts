import * as stream from 'stream'
import { promisify } from 'util'

const pipeline = promisify(stream.pipeline)

/**
 * By default, streams deal with `Buffer`s. These are fine for
 * passing string data or binary like images, but often we want
 * to deal with objects and not have to serialize back and forth.
 * No problem, just use `objectMode`
 */
const run = async () => {
  const readable = new stream.Readable({
    read: () => {
      readable.push('foo')
      readable.push('bar')
      readable.push(null)
    },
  })

  const transform = new stream.Transform({
    objectMode: true,
    transform: (chunk, encoding, next) => {
      const obj = { name: chunk.toString().toUpperCase() }
      next(null, obj)
    },
  })

  const writable = new stream.Writable({
    objectMode: true,
    write: (obj, encoding, next) => {
      console.log(JSON.stringify(obj))
      next()
    },
  })

  try {
    await pipeline(readable, transform, writable)
  } catch (error) {
    console.error(error)
  }
}

run()
