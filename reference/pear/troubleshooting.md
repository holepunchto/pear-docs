# Troubleshooting

The article aims to help troubleshooting confusing scenarios while developing Pear applications.

## `Pear.teardown` Callback Fires But Worker Keeps Running

The Pear.teardown callback is triggered whenever the Pear app start to unload. If it is not exiting, then something is keeping the applications event loop running. A common cause of this is not cleaning up the [worker pipe](./api.md#const-pipe-pear.worker.pipe) by calling `pipe.end()` to gracefully end the writable part of the stream.

