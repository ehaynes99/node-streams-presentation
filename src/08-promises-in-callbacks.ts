/* eslint-disable @typescript-eslint/no-misused-promises */
import * as stream from 'stream'

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
 * The signature of all event handlers is `(...args) => void`
 * Unfortunately, typescript allows passing a `(...args) => Promise<void>`
 * This is always a mistake, because the promise is neither awaited
 * nor are any errors handled.
 *
 * Note the disabled eslint rule above. This protects against that, but
 * must be enabled in `.eslintrc.js`
 */
const run = async () => {
  const readable = new stream.Readable({
    read: () => {
      readable.push('foo')
      readable.push('bar')
      readable.push(null)
    },
  })

  // NOT SEQUENTIAL!!!!!
  // this will rapidly create all of the promises to run in parallel!
  readable.on('data', async (chunk) => {
    await callApi(chunk.toString())
  })
}

run()
