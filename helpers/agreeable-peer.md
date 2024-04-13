# Agreeable Peer 

<mark style="background-color:#8484ff;">**experimental**</mark>

Agreeable Peer is a project that simplifies the creation and consumption of remote services over a hyperdht network. 
It is built on top of robust foundations such as HyperDHT, protomux, and jsonrpc-mux, but provides an easy-to-use interface, 
making it accessible for web developers transitioning to p2p technologies.

>[GitHub (Agreeable-peer)](https://github.com/ryanramage/agreeable-peer)

* [Installation](agreeable-peer.md#installation)
* [Basic usage](agreeable-peer.md#basic-usage)
  * [Defining the Agreement](agreeable-peer.md#defining-the-agreement)
  * [Hosting the Agreement](agreeable-peer.md#hosting-the-agreement)
  * [Fetching the Agreement](agreeable-peer.md#fetching-the-agreement)
  * [Coding a Client](agreeable-peer.md#coding-a-client)
* [API](agreeable-peer.md#api)

### Installation

Install with [npm](https://www.npmjs.com/):

```bash
npm install agreeable-peer agreeable 
```

### Basic usage

#### Define the agreemement

Here's a simple example of an agreeable-compatible agreement. 
Zod functions have been carefully chosen to provide the best programmatic descriptive power with strong JSDoc infer compatibility.

agreement.mjs

```javascript
import { z, addRoute } from 'agreeable'

// define the shape of the functions available
export const AddTwo = z.function().args(z.object({
  a: z.number().describe('the first number'),
  b: z.number().describe('the second number')
})).returns(z.promise(z.number().describe('the sum of a and b')))

export const Ping = z.function().args().returns(z.promise())

export const GenerateNickname = z.function().args(z.object({
  first: z.string().describe('the first name'),
  last: z.string().describe('the last name')
})).returns(z.promise(z.string()))

// describe the api, using the functions as routes
const api = { 
  role: 'exampleRpc', 
  version: '1.0.0',
  description: 'a simple example api',
  routes: {
    addTwo: addRoute(AddTwo),
    ping: addRoute(Ping),
    generateNickname: addRoute(GenerateNickname)
  }
}
export default api 

```

#### Host the agreement

Here we provide in implementation of the agreement. Notice the type checking we get from JSDoc that will provide compile time
information using zod infer and JSDoc types. 
At runtime any params coming into the implementation will also be rejected back to the client
if they dont match the agreement.

index.mjs

```javascript
// @ts-check
import { loadAgreement, host, z }  from 'agreeable-peer'
import { AddTwo, Ping, GenerateNickname } from './agreement.mjs'

/** @type { z.infer<AddTwo> } addTwo */
const addTwo = async ({a, b}) => a + b
   
/** @type { z.infer<Ping> } ping */
const ping = async () => console.log('pinged!')

/** @type { z.infer<GenerateNickname> } generateNickname */
const generateNickname = async ({first}) => `silly ${first}`

host(await loadAgreement('./agreement.mjs', import.meta.url), { 
  addTwo, ping, generateNickname 
})

```

With the agreement in place, you can now run the peer. Simply run it in node (or bare/pear) and get the public key.

```bash
node index.mjs
listening on: 3e32bb2d191316d952ae77439f7ec00a5c4fea8a01953b84d1b4eee36173e1ca
```

#### Fetch the agreement

The peer must provide you with the public key. 
In the future, we will provide a registry lookup service. 
For now, it's up to you to obtain the public key.

You must also get the agreement.mjs file. 
The peer can send it to you on another channel, or you can use the agreeable-ui to fetch it.

Agreeable-UI

```bash
pear run pear://qrxbzxyqup1egwjnrmp7fcikk31nekecn43xerq65iq3gjxiaury
```


Alternatively, visit the github [agreeable-ui](https://github.com/ryanramage/agreeable-ui) and pear dev it
Then paste the public key of the service into the UI. Once it connects, you can download the agreement.mjs file from your peer


#### Code a client  

In this small example, the client uses the type checking of the agreement. 
Again this is balanced to use zod infer for JSDocs, and Agreeable check the types going to and from the host.


client.mjs

```javascript
// @ts-check
import { z, Caller } from 'agreeable-peer'
import agreement, { AddTwo, Ping, GenerateNickname } from './agreement.mjs';

const peerKey = process.argv[2]
const caller = new Caller(peerKey)
/** @type{{ 
 *   addTwo: z.infer<AddTwo> 
 *   ping: z.infer<Ping>
 *   generateNickname: z.infer<GenerateNickname>
 * }} */
// @ts-expect-error
const { addTwo, ping, generateNickname } = caller.proxy(agreement)

const results = await addTwo({ a: 1, b: 2 })
console.log(results)
await ping()
const nickname = await generateNickname({ first: 'steve', last: 'smith' })
console.log(nickname)
caller.destroy()

```

Note: The @ts-expect-error annotation is to remove a small compile time error with the destructring the proxy assignment. 
It is shown here for completeness as a way to have no warnings in your editor. 

Now we run the client, passing in the host public key to connect to. 

```bash
node client.mjs 3e32bb2d191316d952ae77439f7ec00a5c4fea8a01953b84d1b4eee36173e1ca
3
silly steve
```


### API

#### **`mux = new Protomux(stream, [options])`**


#### **`mux = Protomux.from(stream | muxer, [options])`**

Helper to accept either an existing muxer instance or a stream (which creates a new one).

**`const channel = mux.createChannel([options])`**

