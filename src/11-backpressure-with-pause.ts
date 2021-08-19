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
 * Sometimes, you can't use `pipeline` (maybe some third party lib doesn't
 * conform to the streams api). In that case, you can `pause` the stream,
 * wait for some processing, and `resume`.
 *
 * The Writable or Transform options are preferrable, as many read streams
 * will buffer some content
 */
const run = async () => {
  const readable = new stream.Readable({
    read: () => {
      readable.push('foo')
      readable.push('bar')
      readable.push(null)
    },
  })

  readable.on('data', (chunk) => {
    readable.pause()
    const upload = async () => {
      try {
        await callApi(chunk.toString())
      } catch (error) {
        console.error(error)
      }
      readable.resume()
    }
    upload()
  })
}

run()
