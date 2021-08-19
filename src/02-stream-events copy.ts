/* eslint-disable @typescript-eslint/no-unused-vars */
import * as stream from 'stream'

/**
 * These are all of the types of events for Readable and Writable streams.
 * Note: Transform and Duplex streams have the union of both as their events.
 * Also Note: This example doesn't exercise these handlers, but is just for
 */
const run = async () => {
  const readable = new stream.Readable({
    read: () => {
      readable.push('foo')
      readable.push('bar')
      readable.push(null)
    },
  })
    .on('data', (chunk: any) => console.log('read data', chunk.toString()))
    .on('end', () => console.log('read end'))
    .on('error', (error: Error) => console.error('read error', error.message))
    .on('close', () => console.log('read close'))

  // transform is combination of read events and write events
  const transform = new stream.Transform({
    transform: (chunk, encoding, next) => {
      const upcased = chunk.toString().toUpperCase()
      const error = null
      // node callbacks take an error first, so pass (null, data) for success
      next(error, upcased)
    },
  })
    .on('data', (chunk: any) => console.log('transform data', chunk.toString()))
    .on('end', () => console.log('transform end'))
    .on('error', (error: Error) => console.error('transform error', error.message))
    .on('close', () => console.log('transform close'))
    .on('drain', () => console.log('transform drain'))
    .on('finish', () => console.log('transform finish'))

  const writable = new stream.Writable({
    write: (chunk, encoding, next) => {
      console.log(chunk.toString())
      next(null)
    },
  })
    .on('close', () => console.log('write stream close'))
    .on('drain', () => console.log('write stream drain'))
    .on('error', (error: Error) => console.error('write stream error', error.message))
    .on('finish', () => console.log('write stream finish'))
    // these two will be the preceeding stream
    .on('pipe', (src: stream.Readable) => console.log('write stream pipe'))
    .on('unpipe', (src: stream.Readable) => console.log('write stream unpipe'))

  readable.pipe(transform).pipe(writable)
}

run()
