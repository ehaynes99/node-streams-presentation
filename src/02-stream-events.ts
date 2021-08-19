import * as stream from 'stream'

/**
 * This example doesn't fire all of them, but these are the most common
 * events fired.
 * Note: Transform and Duplex streams have the union of both as their events.
 */
const run = async () => {
  const readable = new stream.Readable({
    read: () => {
      readable.push('foo')
      readable.push('bar')
      // emit is immediate, where push is buffered, so it'll fire its event handler first
      readable.emit('error', new Error('oh no!'))
      // pushing `null` means "stream is done reading"
      readable.push(null)
    },
  })
    // fires each time a chunk of data is sent
    .on('data', (chunk: any) => console.log('read data', chunk.toString()))
    // fires on errors
    .on('error', (error: Error) => console.error('read error', error.message))
    // fires when all reading is complete
    .on('end', () => console.log('read end'))
    // not all Readable use this, but fires after e.g. a file or http connection is closed
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
    // fires each time a chunk of data is SENT
    .on('data', (chunk: any) => console.log('transform data', chunk.toString()))
    // fires on errors
    .on('error', (error: Error) => console.error('transform error', error.message))
    // end is a Readable event, and fires when done READING
    .on('end', () => console.log('transform end'))
    // finish is a Writable event, and fires when done WRITING
    .on('finish', () => console.log('transform finish'))

  const writable = new stream.Writable({
    write: (chunk, encoding, next) => {
      console.log('wrote', chunk.toString(), '\n')
      next()
    },
  })
    // fires on errors
    .on('error', (error: Error) => console.error('write stream error', error.message))
    // fires when done writing
    .on('finish', () => console.log('write stream finish'))
    // not all Writable use this, but fires after e.g. a file or http connection is closed
    .on('close', () => console.log('write stream close'))

  readable.pipe(transform).pipe(writable)
}

run()
