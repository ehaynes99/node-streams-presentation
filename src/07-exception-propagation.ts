import * as stream from 'stream'

process.on('uncaughtException', (error) => {
  console.error('NOTHING handled our error!!!!!!', error.message)
})

/**
 * Exceptions thrown within streams are NEVER HANDLED!!!!!!!!!
 * ALWAYS ALWAYS ALWAYS catch exceptions in event handlers. If you
 * need to surface an error, use `emit('error', someError)`
 */
const run = () => {
  const readable = new stream.Readable({
    read: () => {
      throw new Error('oh no!!!!')
    },
  })

  const writable = new stream.Writable({
    write: (chunk) => {
      console.log('***** chunk:', chunk)
    },
  })

  readable
    .on('error', (error) => console.error('handled readable error', error.message))
    .pipe(writable)
    .on('error', (error) => console.error('handled writable error', error.message))
}

run()
