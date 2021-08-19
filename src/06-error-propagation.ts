import * as stream from 'stream'

// if we get here, NOTHING handled our error!!!!!!
process.on('uncaughtException', (error) => {
  console.error('completely unhandled!!!!', error.message)
})

const badErrorHandling = () => {
  const readable = new stream.Readable({
    read: () => {
      readable.emit('error', new Error('oh no!!!!'))
    },
  })

  const writable = new stream.Writable({
    write: (chunk) => {
      console.log('***** chunk:', chunk)
    },
  })


  readable.pipe(writable).on('error', (error) => {
    console.error(error)
  })
}

const goodErrorHandling = () => {
  const readable = new stream.Readable({
    read: () => {
      readable.emit('error', new Error('oh no!!!!'))
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

const run = () => {
  badErrorHandling()

  goodErrorHandling()
}

run()
