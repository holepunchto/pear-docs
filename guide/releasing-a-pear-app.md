# Releasing a Pear Application

Pear Applications are stored in an append-only log ([hypercore](../building-blocks/hypercore.md)) and the log has a length.

Pear versions takes the form `<fork>.<length>.<key>`. The version length of a Pear application is the length of its append-only log.

When an application has not been marked with a release, `pear run <key>` opens the the application at its latest version length. This is excellent in development, both locally and for other peers to preview prereleased work.

However, once a release has been marked `pear run <key>` will only open the latest marked release.

## Step 1: Staging Production

The `pear stage` command derives an application key from the application name as defined in the project `package.json` file and the specified `channel` name. The `pear stage dev` convention for development can be complemented with a `production` channel name for production. Running the following command in a Pear Project folder will output an application key.

```sh
pear stage production
```

Using separate channels for development and production means there's an application key for trusted peers and an application key for public peers. The development key can remain unreleased so that `pear run <key>` loads the latest staged changes by default while releases can be marked on the production key so that `pear run <key>` loads the latest stable release by default for production.

## Step 2: Marking a Release

Changes to an application can only propagate to peers if the application is being seeded:

```
pear seed production
```

To view the help for the `pear release` command run `pear release help`.

To indicate the latest staged changes on the production channel is at a release point run:

```
pear release production
```

## Step 3: Running staged from a released app

After marking a release, make a trivial change to the project (e.g. add a console.log somewhere), check it works with the `pear dev` command and then stage it with `pear stage production`.

Opening the application with `pear run <key>` will **not** result in the log being output because `pear run` will load the latest marked release before the added log was staged.

The latest staged changes on a released application can be previewed using the `--checkout` flag:

```
pear run <key> --checkout=staged
```

The value of the `--checkout` flag may be `staged`, `released` (default) or a number representing the specific version length to checkout.

## Discussion

### The dump-stage-release strategy

A development application key can be shared among trusted peers - at which point it could be referred to as an internal application key (internal to that group of peers who have the key).

While using different channel names by convention makes good sense, using `pear stage dev` and `pear stage production`  on the same machine can have practical limitations.

A dump-stage-release strategy can be employed to futher seperate the concerns between development and production and enable different machines to own internal vs production keys.

The machine that will hold the production key can run:

```
pear dump <internal-key> <path-to-app-production-dir>
```

This will synchronize the application files to disk. It's a reverse stage.

Once complete the project can be staged from the production machine with:

```
pear stage production
```

Then released with:

```
pear release production
```

A `pear seed production` process would also need to be running for other peers to access the application.

The same three commands in order, `pear dump`, `pear stage` and `pear release`, can be used to carve a release from an internal key to a production key across different machines at any time.

### Distribution Packages

Asset-building of Distribution Packages (.dmg, .msi, .appimage) is currently not featured by Pear but is a feature for the future.

## Next

* [Starting a Pear Desktop Project](./starting-a-pear-desktop-project.md)
* [Making a Pear Desktop Application](./making-a-pear-desktop-app.md)
* [Starting a Pear Terminal Project](./starting-a-pear-terminal-project.md)
* [Making a Pear Terminal Application](./making-a-pear-terminal-app.md)
* [Sharing a Pear Application](./sharing-a-pear-app.md)