# Troubleshooting

The article aims to help troubleshooting confusing scenarios while developing Pear applications.

## `Pear.teardown` Callback Fires But Worker Keeps Running

The Pear.teardown callback is triggered whenever the Pear app start to unload. If it is not exiting, then something is keeping the applications event loop running. A common cause of this is not cleaning up the [worker pipe](./api.md#const-pipe-pear.worker.pipe) by calling `pipe.end()` to gracefully end the writable part of the stream.

## `pear run` Exits Without Running the Application

If after debugging an application it seems the issue is happening in the Pear platform itself, try the following steps to debug the issue:

1. Run pear app with logs enabled `pear --log run -d .`.
2. If no helpful info, run sidecar with logs `pear sidecar --log-level 3`.  
   If the `pear sidecar` stops after printing `Closing any current Sidecar clients...`, then the current Pear Sidecar process is hanging. Check the next steps for forensics that might explain why, but then kill existing Pear processes.
   Note that this will close any running pear applications such as Keet.
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
