# Jsonrpc-mux

<mark style="background-color:green;">**stable**</mark>

JSONRPC 2.0 over protomux

<http://www.jsonrpc.org/specification>

> [GitHub (Jsonrpc-mux)](https://github.com/holepunchto/jsonrpc-mux)

* [Installation](localdrive.md#installation)
* [API](localdrive.md#api)
* [Examples](localdrive.md#examples)

### Installation

Install with [npm](https://www.npmjs.com/):

```bash
npm install jsonrpc-mux
```

### API

#### `new JSONRPCMux(protomux, id = null, userData = null) => channel`

Create a new JSON-RPC multiplex channel.

##### Arguments

###### `protomux`

A [`Protomux`](https://github.com/holepunchto/protomux) instance.

###### `id`

Optionally set the resulting `channel.id` property to the input value. Default `null`.

###### `userData`

Optionally set the resulting `channel.userData` property to the input value. Default `null`.

#### `channel.protomux`

The [`Protomux`](https://github.com/mafintosh/protomux) instance providing the protocol multiplexing layer.

Read and write. Can be dynamically set to replace the Protomux muxer.

#### `channel.socket`

The underlying socket, from the `Protomux` instance.

#### `channel.request(method, params, opts}) => Promise`

Make a JSONRPC 2.0 Request. Call an RPC method and wait for a response. The returned promise resolves or rejects depending on whether the JSON-RPC response object has a `result` or `error` property.

If an invalid method is requested or the request stalls for any reason it will timeout after `opts.timeout` (default 650ms).

##### Arguments

##### `method` `<String>`

The method name to call.

###### `params` `<Object>`

Methods' named parameters.

###### `opts` `<Object>`

* `signal` -  An `AbortController` signal. The `channel.request` method will throw on abort.
* `timeout` -  Milliseconds. Self-abort after given timeout. Default `650`.

#### `channel.notify(method, params})`

Make a JSONRPC 2.0 Notification. Call an RPC method fire-and-forget style.

If an invalid method is requested or the request stalls for any reason this will be silently ignored due to fire-and-forget behaviour.

##### Arguments

###### `method` `<String>`

The method name to call.

###### `params` `<Object>`

Methods' named parameters.

#### `channel.method(name, responder))`

Register a method and begin listening for messages.

The `responder` function is called with `params` and `reply` arguments.

Pass `null` as the second `responder` argument instead of a function to unregister a method.

##### Arguments

###### `name` `<String>`

The name of the method

###### `responder` `async (params, reply) => { ... } |  async (params) => { ... }`

Handler function or `null`.

If the  `responder` is `null` unregister the method.

If the supplied `responder` signature is `(params, reply) => {}` call `reply` to send a response back.

If the supplied `responder` signature is `(params) => {}` or `() => {}` then returned values form the result response and any thrown value creates an error response.

**`reply(valueOrError, isError)`**

If the argument supplied to `reply` is an `instanceof Error` a JSONRPC error response (`{ jsonrpc: '2.0', id: 999, error: { message, code } }`) will be generated otherwise the supplied argument forms the result response (`{ jsonrpc: '2.0', id: 999, result: msg }`). This can be forced off by setting the second argument to `false`. Likewise, a non-error object can be considered an error-response by passing `true` as the second argument to reply - it must have a `message` property.

### Examples

```js
  achannel.method('example', (params, reply) => {
    reply({ a: 'response', echo: params })
  })
```

```js
  achannel.method('example', (params, reply) => {
    return { a: 'response', echo: params }
  })
```

```js
  achannel.method('example', (params, reply) => {
    reply(new Error('an error response'))
  })
```

```js
  achannel.method('example', (params, reply) => {
    return new Error('an error response') // returning an error is also an error response
  })
```

```js
  achannel.method('example', (params, reply) => {
    reply({ message: 'an error response'}, true)
  })
```

```js
  achannel.method('example', (params, reply) => {
    throw new Error('an error response')
  })
```
