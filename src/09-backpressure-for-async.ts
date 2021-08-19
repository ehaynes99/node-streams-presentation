import * as stream from 'stream'
import { promisify } from 'util'

// mock an api call that takes 1 second
const callApi = async (data: string) => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      console.log('pretend api call with:', data, new Date())
      resolve()
    }, 1000)
  })
}

/**
 * Writable streams call a callback once complete, so we can prevent
 * the readable from pulling in too much data by deferring the callback
 * until after we have `await`ed something.
 */
const run = async () => {
  const readable = new stream.Readable({
    read: () => {
      readable.push('foo')
      readable.push('bar')
      readable.push(null)
    },
  })

  const writable = new stream.Writable({
    write: async (chunk, encoding, next) => {
      try {
        await callApi(chunk.toString())
      } catch (error) {
        console.error(error)
      } finally {
        // the stream will stop accepting data until the next is called
        // (technically, most will buffer *some* data, but won't get overwhelmed)
        next()
      }
    },
  })

  const pipeline = promisify(stream.pipeline)
  try {
    await pipeline(readable, writable)
  } catch (error) {
    console.error(error)
  }
}

run()
