import * as stream from 'stream'
import { promisify } from 'util'

// promisify converts functions that take callbacks into functions
// that return promises that reject on error
const pipeline = promisify(stream.pipeline)

const createStreams = () => {
  const readable = new stream.Readable({
    read: () => {
      readable.push('foo')
      readable.push('bar')
      readable.push(null)
    },
  })

  const transform = new stream.Transform({
    transform: (chunk, encoding, next) => {
      const upcased = chunk.toString().toUpperCase()
      next(null, upcased)
    },
  })

  const writable = new stream.Writable({
    write: (chunk, encoding, next) => {
      console.log(chunk.toString())
      next()
    },
  })

  return { readable, transform, writable }
}

/**
 * An example of `pipeline` using the callback syntax.
 */
const withCallback = () => {
  const { readable, transform, writable } = createStreams()

  stream.pipeline(readable, transform, writable, (error) => {
    if (error) {
      console.error('error', error)
    } else {
      console.log('completed successfully!')
    }
  })
}

/**
 * An example of `pipeline` using promises. THIS IS THE PREFERRED
 * MEANS OF TURNING STREAMS INTO PROMISES!!!!
 */
const withPromisify = async () => {
  const { readable, transform, writable } = createStreams()
  try {
    await pipeline(readable, transform, writable)
    console.log('completed successfully!')
  } catch (error) {
    console.error('error', error)
  }
}

const run = async () => {
  withCallback()
  await withPromisify()
}

run()
