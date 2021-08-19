import * as stream from 'stream'
import { promisify } from 'util'

const pipeline = promisify(stream.pipeline)

/**
 * This is a simple utility function that may be cleaner if async processing is
 * common in your application. It simply wraps an async function in a
 * `Transform` and takes care of the callback. The async function can handle its
 * own errors if you don't want to propagate.
 */
const asyncHandler = <T>(fn: (chunk: any, encoding: BufferEncoding) => Promise<T>) => {
  return new stream.Transform({
    transform: async (chunk, encoding, next) => {
      try {
        next(null, await fn(chunk, encoding))
      } catch (error) {
        next(error)
      }
    },
  })
}

const run = async () => {
  const readable = new stream.Readable({
    read: () => {
      readable.push('foo')
      readable.push('bar')
      readable.push(null)
    },
  })

  const writable = asyncHandler<string>(async (chunk) => {
    return await Promise.resolve(chunk.toString())
  })

  try {
    await pipeline(readable, writable)
  } catch (error) {
    console.error(error)
  }
}

run()
