# Streams in nodejs
![Dan Abramov is afraid of streams](/images/dan-abramov-streams.png)

^ One of the programmers I most admire says...

---

This is a brief overview with examples of using streams in nodejs. It will cover some common mistakes, and some options to make dealing with streams easier.

TLDR;
If you take nothing else from this, see the [Pipeline Section](#pipeline)

NOTE: Most of our apps are still using node 12.x, so throughout this document, examples will apply to that version unless specifically stated otherwise.

## What are streams?
Streams are a mechanism for consuming data sequentially. They are particularly useful in cases where the amount of data passing through is larger than a size that would be wise to pull into memory all at once.

## But, what ARE streams?
Under the hood, streams are a type of `EventEmitter`. This is a common abstraction across the JS ecosystem for event-driven processing. In node, streams are the majority of the common cases, but they're widely used in the browser as well. Simply put, an emitter is a "pub/sub" model that allows event handlers to be registered to arbitrary events labelled by a string, and allows code elsewhere to fire those events and pass data.

Example:
```typescript
const emitter = new EventEmitter()

emitter.on('eat', (food: string) => {
  if (food === 'brussel sprouts') {
    console.log('Yuck, brussel sprouts')
  } else {
    console.log('Mmmm, ' + food)
  }
})

emitter.emit('eat', 'steak')
emitter.emit('eat', 'potatoes')
emitter.emit('eat', 'brussel sprouts')

// output:
// Mmmm, steak
// Mmmm, potatoes
// Yuck, brussel sprouts
```
Note that `on` is a nodejs alias for `addEventListener`. Most emitters in the browser only define the latter.

```typescript
window.addEventListener('click', () => console.log('you clicked it!!!!'))
```

## What events do streams emit?
Well... it depends. There are a base set of events for stream types, but any implementation can add any additional ones, so have to consult the docs for most.

For reference, here is the TS definition, but read on for more info:
https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/node/v12/stream.d.ts

In general: `Readable` have:
```typescript
on(event: 'close', listener: () => void): this;
on(event: 'data', listener: (chunk: any) => void): this;
on(event: 'end', listener: () => void): this;
on(event: 'error', listener: (err: Error) => void): this;
on(event: 'pause', listener: () => void): this;
on(event: 'readable', listener: () => void): this;
on(event: 'resume', listener: () => void): this;
on(event: string | symbol, listener: (...args: any[]) => void): this;
```

and `Writable` streams have:
```typescript
on(event: 'close', listener: () => void): this;
on(event: 'drain', listener: () => void): this;
on(event: 'error', listener: (err: Error) => void): this;
on(event: 'finish', listener: () => void): this;
on(event: 'pipe', listener: (src: Readable) => void): this;
on(event: 'unpipe', listener: (src: Readable) => void): this;
on(event: string | symbol, listener: (...args: any[]) => void): this;
```

## What are the types of streams?
There are 2 main types of streams, and then some derivatives:
#### Readable Streams
nodejs 12.x docs: https://nodejs.org/docs/latest-v12.x/api/stream.html#stream_class_stream_readable

Readable streams are SOURCES of data. The most common examples are reading from files and reading from http requests. In all likelihood, you'll rarely create these from scratch.

#### Writable Streams
nodejs 12.x docs: https://nodejs.org/docs/latest-v12.x/api/stream.html#stream_class_stream_writable

Writable streams are TARGETS of data. Common examples are writing to files, writing to http responses, and pushing to queues. Creating these from scratch is more common.

#### Transform Streams
nodejs 12.x docs combine this and Duplex Streams (below): https://nodejs.org/docs/latest-v12.x/api/stream.html#stream_duplex_and_transform_streams

Transform streams are both Writable and Readable streams (and it's useful to think of them in this order). They take data in, perform some kind of conversion, and push the result out. **However, there is an often misunderstood benefit of how these work, which is key to asynchronous stream processing** (more below).

#### Duplex Streams
Duplex streams are also Readable and Writable, but you can generally consider these independently. The most common type of these is websockets; the server both sends events TO the client and receives events FROM the client.

## Piping streams
The main purpose of streams is to pipe from a Readable stream to a Writable stream. Any number of Transform streams can be inserted in between.

```typescript
// BAD example! See below about error propagation

import * as fs from 'fs'
import { createGzip } from 'zlib'

const compress = () => {
  const readable = fs.createReadStream('archive.tar')
  const transform = createGzip()
  const writable = fs.createWriteStream('archive.tar.gz')

  readable.pipe(transform).pipe(writable)
}
```

## Pipeline
nodejs 12.x docs: https://nodejs.org/docs/latest-v12.x/api/stream.html#stream_stream_pipeline_streams_callback

If you take nothing else from this, remember `pipeline`. 
I'm going to mention this first, and then below go into why it is preferable to the `pipe` method. IMO, this should be the default mechanism for chaining streams together unless you have a compelling reason to do otherwise (listening to the various "usually ignore" events).

With callbacks:
```typescript
import * as fs from 'fs'
import { createGzip } from 'zlib'
import * as stream from 'stream'

const compress = () => {
  const readable = fs.createReadStream('archive.tar')
  const transform = createGzip()
  const writable = fs.createWriteStream('archive.tar.gz')
  stream.pipeline(
    readable
    transform
    writable
    (error) => {
      if (error) {
        console.error('error', error)
      } else {
        console.log('completed successfully!')
      }
    }
  )
}
```
Callbacks have largely fallen out of favor in favor of Promises. While not directly supported in many node apis, the `promisify` function in the std lib's `util` package
takes in a function that takes a callback and wraps it in a promise. E.g.
```typescript
import * as fs from 'fs'
import { createGzip } from 'zlib'
import * as stream from 'stream'
import { promisify } from 'util'

const pipeline = promisify(stream.pipeline)

const compress = async () => {
  await pipeline(
    fs.createReadStream('archive.tar'), // readable
    createGzip(), // transform
    fs.createWriteStream('archive.tar.gz') // writable
  )
}
```

nodejs 15.x+
Starting in node 15, there is a `stream/promises` package that supports promises natively:

```typescript
// node 15.x and up!
import stream from 'stream/promises'
import * as fs from 'fs'
import { createGzip } from 'zlib'

const compress = async () => {
  try {
    await stream.pipeline(
      fs.createReadStream('archive.tar'), // readable
      createGzip(), // transform
      fs.createWriteStream('archive.tar.gz') // writable
    )
  } catch (error) {
    console.error('could not pipe!', error)
  }
}
```

## Error propagation
The main benefits of `pipeline` is that it handles both error propagation and closing streams on errors. You might think that this would work:

```typescript
// DON'T DO THIS!!!!
const compress = () => {
  return new Promise((resolve, reject) => {
    const readable = fs.createReadStream('archive.tar')
    const transform = createGzip()
    const writable = fs.createWriteStream('archive.tar.gz')

    readable.pipe(transform).pipe(writable)
      .on('error', reject)
      .on('finish', resolve);
  })
}
```
However, stream errors don't propagate through `pipe`, so if there is an error reading the file, **the promise will NEVER resolve**, and the read stream would not release its handle. To deal with errors in `pipe`, you would have to handle errors at **EACH STEP**!

```typescript
// gross...
const compress = () => {
  return new Promise((resolve, reject) => {
    const readable = fs.createReadStream('archive.tar')
      .on('error', (error) => {
        readable.close()
        reject(error)
      })
    const transform = createGzip()
      .on('error', reject)
    const writable = fs.createWriteStream('archive.tar.gz')

    readable.pipe(transform).pipe(writable)
      .on('error', (error) => {
        writable.close()
        reject(error)
      })
      .on('finish', resolve)
  })
}
```

## Event listener order
A good pattern for any software development is consider things as isolated, independent parts that are then combined together by some orchestrator. This practice is great with streams as well. Rather than thinking about the whole chain as one big operation, think of them as:
* a `Readable`
* 0 or more `Transform`s
* a `Writable`

`pipeline` implicitly guides you in this direction. However, in places where you can't use it, it's still a good practice. Even if you don't forget to attach error handlers to all parts of your chain, the order of event handler registration is important. Consider:

```typescript
// DON'T DO THIS
const writeToDisk = (file: string, readable: Readable) => {
  const writable = fs.createWriteStream(file)
  return readable.pipe(writable)
}

const readable = getReadStream()
const writable = writeToDisk(readable)

await doSomethingAsync()

readable.on('error', (error) => console.error(error))
```
The streams are piped, then execution is suspended here while `doSomethingAsync` happens. Upon return, the error handler is added. However, this means the stream has likely already started transferring data. Event handlers only work "from now on", so any error that happened while `doSomethingAsync` was completing would be missed.

## Dealing with objects
By default, streams move data as `Buffer`s. This is great for streams of text or
binary files, but often amidst our streams, we want to translate into JS objects.
It would be a pain to have to serialize to/from a buffer at every step. No worries,
though. Streams have an `objectMode`.

```typescript
const readable = new stream.Readable({
  objectMode: true,
  read: () => {
    readable.push({ name: 'foo' })
    readable.push({ name: 'bar' })
    readable.push(null)
  },
})
```
We can use this with `Transform` streams to extract data in the middle. For example, a parser that reads xml and outputs objects is a more complex version of:

```typescript
const readable = new stream.Readable({
  read: () => {
    readable.push('foo')
    readable.push('bar')
    readable.push(null)
  },
})

// outputs `{ name: 'foo' }` and `{ name: 'bar' }`
const transform = new stream.Transform({
  objectMode: true,
  transform: (chunk, encoding, next) => {
    const obj = { name: chunk.toString() }
    next(null, obj)
  },
})
```


## Don't make any `Promise`s!!!!!!!!
Since streams are designed for asynchronous processing, you might think that they would play nicely with Promises and async/await. You would be wrong. The signature for event callbacks always has a return type of `void`. Promises ARE NOT awaited!

```typescript
const callApi = async (data: string) => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      console.log('pretend api call with:', data, new Date())
      resolve()
    }, 1000)
  })
}

const readable = // get a readable

// these both fire at the same time because `on`
// doesn't wait for promises!!!!
readable.on('data', async (chunk) => {
  await callApi(chunk.toString())
})
// output:
// pretend api call with: foo 2021-08-19T06:24:09.039Z
// pretend api call with: bar 2021-08-19T06:24:09.042Z
```

**With large quantities of data, this can end up with thousands of parallel promises!!!!!**

#### eslint tip
eslint has this rule:
```json
"@typescript-eslint/no-misused-promises": ["error"],
```
Unfortunately in Typescript -- EVEN IN STRICT MODE -- functions with a return type of `Promise<void>` ARE FULLY COMPATIBILE with functions returning simply `void`. This is almost always an error, and this rule prevents that.
```typescript
// normally no error, but with the rule above, eslint will emit:
// `Promise returned in function argument where a void return was expected`
someStream.on('data', async (data) => /* do something */)
```

## Transform to the rescue!
If you recall above, transform streams do some work, and then pass along to then next step in the chain

Streams inherently support what's known as "backpressure". In the above `compress` examples, it's faster to read from a file than write to a file. The write stream has a backpressure mechanism built in so that the read stream doesn't push more data than it can handle.

This same mechanism can be used for dealing with async processing. Note that both `Writable` and `Transform` accept a callback. Additional data won't be accepted until the callback is called.

```typescript
const callApi = async (data: string) => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      console.log('pretend api call with:', data, new Date())
      resolve()
    }, 1000)
  })
}

const readable = // get a readable
const writable = new stream.Writable({
  write: async (chunk, encoding, next) => {
    try {
      await callApi(chunk.toString())
    } catch (error) {
      console.error(error)
    } finally {
      // the stream will stop accepting data until the callback is called
      // (technically, it'll buffer *some* data, but won't get overwhelmed)
      next()
    }
  },
})
await promisify(pipeline)(readable, writable)
// output:
// pretend api call with: foo 2021-08-19T06:33:39.137Z
// pretend api call with: bar 2021-08-19T06:33:40.141Z
```