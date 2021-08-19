import * as stream from 'stream'

/**
 * Example of using `pipe` to chain streams together.
 *
 * See the next example with `pipeline` for a better way to do this!!!
 */
const run = () => {
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

  readable.pipe(transform).pipe(writable)
}

run()
