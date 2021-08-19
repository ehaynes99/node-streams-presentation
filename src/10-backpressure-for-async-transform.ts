import * as stream from 'stream'
import { promisify } from 'util'

// mock an api call that takes 1 second
const callApi = async (data: string) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('pretend api call with:', data, new Date())
      resolve(data.toUpperCase())
    }, 1000)
  })
}

/**
 * Transform streams can also be used for async if further action is needed
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
    transform: async (chunk, encoding, next) => {
      try {
        const upcased = await callApi(chunk.toString())
        next(null, upcased)
      } catch (error) {
        console.error(error)
        next(error)
        // could also handle here and send some alternate value
      }
    },
  })

  const writable = new stream.Writable({
    write: (chunk, encoding, next) => {
      console.log(chunk.toString())
      next()
    },
  })

  const pipeline = promisify(stream.pipeline)
  try {
    await pipeline(readable, transform, writable)
  } catch (error) {
    console.error(error)
  }
}

run()
