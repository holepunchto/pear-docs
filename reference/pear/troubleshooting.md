# Troubleshooting Applications

The article aims to help troubleshooting confusing scenarios while developing Pear applications.

## `Pear.teardown` Callback Fires But Worker Keeps Running

The `Pear.teardown(cb)` callback is triggered whenever the Pear app start to unload. If it is not exiting, then something is keeping the applications event loop running. A common cause of this is not cleaning up the [worker pipe](./api.md#const-pipe-pear.worker.pipe) by calling `pipe.end()` to gracefully end the writable part of the stream.

## `pear` CLI Exits Without Running the Application

If after debugging an application it seems the issue is happening in the Pear platform itself, try the following steps to debug the issue:

1. Run pear command with logs enabled `pear --log [command]`.
2. If no helpful info, run sidecar with logs `pear sidecar --log-level 3`.  
   If the `pear sidecar` stops after printing `Closing any current Sidecar clients...`, then the current Pear Sidecar process is hanging. Check the next steps for forensics that might explain why, but then kill existing Pear processes.  
   _Note_ that this will close any running pear applications such as Keet.
3. If still no helpful info, check that there are still pear processes running via `ps aux | grep pear` or equivalent method for finding processes by name.
4. Finally check the crash logs in platform's `current` directory.
   - For sidecar: `sidecar.crash.log`
   - For electron: `electron-main.crash.log`
   - For pear cli: `cli.crash.log`

## You get a `Error: While lock File .. Resource temporarily unavailable`

The Error:
```
Uncaught (in promise) Error: While lock file: ./pear/app-storage/by-random/.../db/LOCK: Resource temporarily unavailable
    at Object.onopen (pear://dev/node_modules/rocksdb-native/lib/state.js:155:27)
```

Means the application is trying to open a RockDB instance on files currently
locked by another process. This means either:

- An application is trying to open the same storage twice.  
  If using `Corestore`, it is recommended to only create only one instance and
  reusing it.
- There are multiple of processes running for the same application.

## Joining a Hyperswarm Topic takes a long time

There can be many reasons but here are a few common reasons:

- Random NAT networks can take longer as another node may be needed to facility the connection.
- Not destroying the hyperswarm instance in the `Pear.teardown()` callback so
  Hyperswarm can unannounce and clean up the DHT.  
  It's recommended to clean up the hyperswarm instance with `swarm.destroy()` before exiting the application. This prevents conflicting records in the DHT for the application's peer which cause it take longer to join a topic.  

  Example:
  ```js
  Pear.teardown(() => swarm.destroy())
  ```

  Make sure to unregister the teardown callback if the swarm is destroyed
  prematurely.

- A firewall is blocking the traffic.  
  Please let Holepunch know if this is the case.

## Running Bare modules in Pear Desktop Applications

For now this is not possible because Pear desktop applications run in Electron which uses Node.js integration. Pear v2 will unify running Pear applications in Bare with Electron as a UI module. This way the main application will be defined as a "Pear-end" process that can be shared across different versions of the application such as CLI, GUI, mobile, etc.

Running a Bare module will give you one of the following errors:

- `Uncaught TypeError: require.addon is not a function`
- `Uncaught ReferenceError: Bare is not defined`

To support both Bare and Node.js compatible modules, import maps can be defined
so a module `fs` can be resolved to `bare-fs` on Bare and `fs` on Node.js.

```
{
  "imports": {
    "fs": {
      "bare": "bare-fs",
      "default": "fs"
    },
    "fs/*": {
      "bare": "bare-fs/*",
      "default": "fs/*"
    }
  },
  "dependencies": {
    "bare-fs": "^2.1.5"
  }
}
```

See [`bare-node`'s "Import maps"](https://github.com/holepunchto/bare-node?tab=readme-ov-file#import-maps) for more details.
