# Autobase

<mark style="background-color:blue;">**experimental**</mark>

Autobase is used to automatically rebase multiple causally-linked Hypercores into a single, linearized Hypercore. The output of an Autobase is 'just a Hypercore', which means it can be used to transform higher-level data structures (like Hyperbee) into multiwriter data structures with minimal additional work.

> Although Autobase is still under development, it finds application in many active projects. Keet rooms, for example, are powered by Autobase! This is a testament to the potential of Autobase, and we are excited to see what else it can achieve.

Notable features include:

* automatic rebasing of multiple causally-linked Hypercores into a single, linearized Hypercore for multi-user collaboration
* low-friction integration into higher-level modules like Hyperbee and Hyperdrive: Autobase's output shares the familiar Hypercore API so peer-to-peer multi-user collaboration is achievable with little additional implementation effort.

> [GitHub (Autobase)](https://github.com/holepunchto/autobase) 

- [Autobase](../building-blocks/autobase.md)
  - [Create a new instance](autobase.md#installation)
  - Basic:
    - Properties:
      - [base.inputs](autobase.md#base.inputs)
      - [base.outputs](autobase.md#base.outputs)
      - [base.localInput](autobase.md#base.localinput)
      - [base.localOutput](autobase.md#base.localoutput)
    - Methods:
      - [base.clock()](autobase.md#base.clock)
      - [base.isAutobase(core)](autobase.md#base.isautobase)
      - [base.append(value, [clock], [input])](autobase.md#base.append)
      - [base.latest([input1, input2, ...])](autobase.md#base.latest)
      - [base.addInput(input)](autobase.md#base.addinput)
      - [base.removeInput(input)](autobase.md#base.removeinput)
      - [base.addOutput(output)](autobase.md#base.addoutput)
      - [base.removeOutput(output)](autobase.md#base.removeoutput)
    - Streams:
      - Methods:
        - [base.createCausalStream()](autobase.md#base.createcasualstream)
        - [base.createReadStream([options])](autobase.md#base.createreadstream)
    - Linearized Views:
      - Properties:
        - [view.status](autobase.md#view.status)
        - [view.length](autobase.md#view.length)
      - Methods:
        - [base.start({ apply, unwrap } = {})](autobase.md#base.start)
        - [view.update()](autobase.md#view.update)
        - [view.get(idx, [options])](autobase.md#view.get)
        - [view.append([blocks])](autobase.md#view.append)


### Installation

Install with [npm](https://www.npmjs.com/):

```bash
npm install autobase
```

>  Autobase is constructed from a known set of trusted input Hypercores. Authorizing these inputs is outside of the scope of Autobase -- this module is unopinionated about trust and assumes it comes from another channel.


### API

#### **`const base = new Autobase([options])`**

Creates a new Autobase from a set of input/output Hypercores.

The following table describes the properties of the optional `options` object.

|      Property     | Description                                                                | Type      | Default |
| :---------------: | -------------------------------------------------------------------------- | --------- | ------- |
|    **`inputs`**   | The list of Hypercores for Autobase to linearize                           | Array     | `[]`    |
|   **`outputs`**   | An optional list of output Hypercores containing linearized views          | Array     | `[]`    |
|  **`localInput`** | The Hypercore that will be written to in base.append operations            | Hypercore | `null`  |
| **`localOutput`** | A writable Hypercore that linearized views will be persisted into          | Hypercore | `null`  |
|  **`autostart`**  | Creates a linearized view (base.view) immediately                           | Boolean   | `false` |
|    **`apply`**    | Creates a linearized view (base.view) immediately using this apply function | Function  | `null`  |
|    **`unwrap`**   | base.view.get calls will return node values only instead of full nodes     | Boolean   | `false` |

#### Properties

#### **`base.inputs`** {#base.inputs}

The list of input Hypercores.

#### **`base.outputs`** {#base.outputs}

The list of output Hypercores containing persisted linearized views.

#### **`base.localInput`** {#base.localInput}

If non-null, this Hypercore will be appended to in [base.append](autobase.md#base.append) operations.

#### **`base.localOutput`** {#base.localoutput}

If non-null `base.view` will be persisted into this Hypercore.

#### **`base.started`** {#base.started}

A Boolean indicating if `base.view` has been created.

See the [linearized views section](autobase.md#linearized-views) for details about the `apply` option.

> ℹ️ Prior to calling `base.start()`, `base.view` will be `null`.


#### Methods

#### **`const clock = base.clock()`** {#base.clock}

Returns a Map containing the latest lengths for all Autobase inputs.

The Map has the form: `(hex-encoded-key) -> (Hypercore length)`

#### **`await Autobase.isAutobase(core)`** {#base.isautobase}

Returns `true` if `core` is an Autobase input or an output.

#### **`await base.append(value, [clock], [input])`** {#base.append}

Append a new value to the autobase.

* `clock`: The causal clock defaults to base.latest.

#### **`const clock = await base.latest([input1, input2, ...])`** {#base.latest}

Generate a causal clock linking the latest entries of each input.

`latest` will update the input Hypercores (`input.update()`) prior to returning the clock.

This is unlikely to be needed generally, prefer to use [`append`](autobase.md#await-baseappendvalue-clock-input) with the default clock:

```javascript
await base.append('hello world')
```

#### **`await base.addInput(input)`** {#base.addinput}

Adds a new input Hypercore.

* `input` must either be a fresh Hypercore, or a Hypercore that has previously been used as an Autobase input.

#### **`await base.removeInput(input)`** {#base.removeinput}

Removes an input Hypercore.

* `input` must be a Hypercore that is currently an input.

{% hint style="info" %}
Removing an input, and then subsequently linearizing the Autobase into an existing output, could result in a large truncation operation on that output -- this is effectively 'purging' that input entirely.

Future releases will see the addition of 'soft removal', which will freeze an input at a specific length, and no process blocks past that length, while still preserving that input's history in linearized views. For most applications, soft removal matches the intuition behind 'removing a user'.
{% endhint %}

#### **`await base.addOutput(output)`** {#base.addoutput}

Adds a new output Hypercore.

* `output` must be either a fresh Hypercore or a Hypercore that was previously used as an Autobase output.

If `base.outputs` is not empty, Autobase will do 'remote linearizing': `base.view.update()` will treat these outputs as the 'trunk', minimizing the amount of local re-processing they need to do during updates.

#### **`await base.removeOutput(output)`** {#base.removeoutput}

Removes an output Hypercore. `output` can be either a Hypercore or a Hypercore key.

* `output` must be a Hypercore, or a Hypercore key, that is currently an output (in `base.outputs`).

### Streams

In order to generate shareable linearized views, Autobase must first be able to generate a deterministic, causal ordering over all the operations in its input Hypercores.

Every input node contains embedded causal information (a vector clock) linking it to previous nodes. By default, when a node is appended without additional options (i.e., `base.append('hello')`), Autobase will embed a clock containing the latest known lengths of all other inputs.

Using the vector clocks in the input nodes, Autobase can generate two types of streams:

#### Causal Streams

Causal streams start at the heads (the last blocks) of all inputs, walk backward, and yield nodes with a deterministic ordering (based on both the clock and the input key) such that anybody who regenerates this stream will observe the same ordering, given the same inputs.

They should fail in the presence of unavailable nodes -- the deterministic ordering ensures that any indexer will process input nodes in the same order.

The simplest kind of linearized view (`const view = base.linearize()`), is just a Hypercore containing the results of a causal stream in reversed order (block N in the index will not be causally dependent on block N+1).

#### **`const stream = base.createCausalStream()`** {#base.createcasualstream}

Generate a Readable stream of input blocks with deterministic, causal ordering.

Any two users who create an Autobase with the same set of inputs, and the same lengths (i.e., both users have the same initial states), and will produce identical causal streams.

If an input node is causally-dependent on another node that is not available, the causal stream will not proceed past that node, as this would produce inconsistent output.

#### Read Streams

Similar to `Hypercore.createReadStream()`, this stream starts at the beginning of each input, and does not guarantee the same deterministic ordering as the causal stream. Unlike causal streams, which are used mainly for indexing, read streams can be used to observe updates. And as they move forward in time, they can be live.

#### **`const stream = base.createReadStream([options])`** {#base.createreadstream}

Generate a Readable stream of input blocks, from earliest to latest.

Unlike `createCausalStream`, the ordering of `createReadStream` is not deterministic. The read stream only gives the guarantee that every node it yields will **not** be causally-dependent on any node yielded later.

Read streams have a public property `checkpoint`, which can be used to create new read streams that resume from the checkpoint's position:

```javascript
const stream1 = base.createReadStream()
// Do something with stream1 here
const stream2 = base.createReadStream({ checkpoint: stream1.checkpoint }) // Resume from stream1.checkpoint
```

`createReadStream` can be passed two custom async hooks:

* `onresolve`: Called when an unsatisfied node (a node that links to an unknown input) is encountered. Can be used to add inputs to the Autobase dynamically.
  * Returning `true` indicates that new inputs were added to the Autobase, and so the read stream should begin processing those inputs.
  * Returning `false` indicates that the missing links were not resolved, and so the node should be yielded immediately as is.
* `onwait`: Called after each node is yielded. Can be used to add inputs to the Autobase dynamically.

`options` include:

| Property         | Description                                                                 | Type       | Default                         |
| ---------------- | --------------------------------------------------------------------------- | ---------- | ------------------------------- |
| **`live`**       | Enables live mode (the stream will continuously yield new nodes)             | Boolean    | `false`                         |
| **`tail`**       | When in live mode, starts at the latest clock instead of the earliest        | Boolean    | `false`                         |
| **`map`**        | A sync map function                                                         | Function   | `(node) => node`                |
| **`checkpoint`** | Resumes from where a previous read stream left off (`readStream.checkpoint`) | Readstream | `null`                          |
| **`wait`**       | If false, the read stream will only yield previously-downloaded blocks      | Boolean    | `true`                          |
| **`onresolve`**  | A resolve hook (described above)                                            | Function   | `async (node) => true \| false` |
| **`onwait`**     | A wait hook (described above)                                               | Function   | `async (node) => undefined`     |

### Linearized Views

Autobase is designed for computing and sharing linearized views over many input Hypercores. A linearized view is a 'merged' view over the inputs, giving a way of interacting with the N input Hypercores as though it were a single, combined Hypercore.

These views, instances of the `LinearizedView` class, in many ways look and feel like normal Hypercores. They support `get`, `update`, and `length` operations.

By default, a view is a persisted version of an Autobase's causal stream, saved into a Hypercore. But a lot more can be done with them: by passing a function into `linearize`'s `apply` option, we can define our own indexing strategies.

Linearized views are incredibly powerful as they can be persisted to a Hypercore using the new `truncate` API added in Hypercore 10. This means that peers querying a multiwriter data structure don't need to read in all changes and apply them themself. Instead, they can start from an existing view that's shared by another peer. If that view is missing indexing any data from inputs, Autobase will create a 'view over the remote view', applying only the changes necessary to bring the remote view up-to-date. Best of all, is that this all happens automatically.

#### Customizing Views with `apply`

The default linearized view is just a persisted causal stream -- input nodes are recorded into an output Hypercore in causal order, with no further modifications. This minimally-processed view is useful on its own for applications that don't follow an event-sourcing pattern (i.e., chat), but most use cases involve processing operations in the inputs into indexed representations.

To support indexing, `base.start` can be provided with an `apply` function that's passed batches of input nodes during rebasing, and can choose what to store in the output. Inside `apply`, the view can be directly mutated through the `view.append` method, and these mutations will be batched when the call exits.

The simplest `apply` function is just a mapper, a function that modifies each input node and saves it into the view in a one-to-one fashion. Here's an example that uppercases String inputs, and saves the resulting view into an `output` Hypercore:

```javascript
base.start({
  async apply (batch) {
    batch = batch.map(({ value }) => Buffer.from(value.toString('utf-8').toUpperCase(), 'utf-8'))
    await view.append(batch)
  }
})
// After base.start, the linearized view is available as a property on the Autobase
await base.view.update()
console.log(base.view.length)
```

#### View Creation

#### **`base.start({ apply, unwrap } = {})`** {#base.start}

Creates a new linearized view, and sets it on `base.view`. The view mirrors the Hypercore API wherever possible, meaning it can be used as a drop-in replacement for a Hypercore instance.

Either call `base.start` manually when to start using `base.view`, or pass either `apply` or `autostart` options to the Autobase constructor. If these constructor options are present, Autobase will start immediately.

When calling `base.start` manually, it must only be called once.

`options` include:

| Property     | Description                                            | Type     | Default         |
| ------------ | ------------------------------------------------------ | -------- | --------------- |
| **`unwrap`** | Set this to auto unwrap the gets to only return .value | Boolean  | `false`         |
| **`apply`**  | The apply function described above                     | Function | `(batch) => {}` |

#### **`view.status`** {#view.status}

The status of the last linearize operation.

Returns an object of the form `{ added: N, removed: M }` where:

* `added` indicates how many nodes were appended to the output during the linearization
* `removed` indicates how many nodes were truncated from the output during the linearization

#### **`view.length`** {#view.length}

The length of the view. Similar to `hypercore.length`.

#### **`await view.update()`** {#view.update}

Ensures the view is up-to-date.

#### **`const entry = await view.get(idx, [options])`** {#view.get}

Gets an entry from the view. If set `unwrap` to true, it returns `entry.value`. Otherwise, it returns an entry similar to this:

```javascript
{
  clock, // the causal clock this entry was created at
  value // the value that is stored here
}
```

#### **`await view.append([blocks])`** {#view.append}

This operation can only be performed inside the `apply` function.
