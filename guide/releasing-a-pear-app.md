# Releasing a Pear Application

Pear applications are stored in an append-only log ([hypercore](../building-blocks/hypercore.md)).

Each version is identified by `<fork>.<length>.<key>`. The length corresponds to the length of the application's append-only log at the time.

{% embed url="https://www.youtube.com/watch?v=OTwY_avUPyI" %} Build with Pear - Episode 03: Releasing Pear Applications {% embeded %}

`pear run <key>` opens the application.

Before a release has been marked, the latest version is used. This is useful during development, to test the app locally and to share a preview with other peers.

Once a release has been marked, `pear run <key>` opens the latest marked release.

## Step 1: Staging Production

`pear stage <channel name>` derives an application key from the channel name and the application name (as defined in the project's `package.json`).

For example, a `pear stage dev` release channel used during development can be complemented with a `production` channel:

```sh
pear stage production
```

Running this command in a Pear project folder outputs an application key.

Using separate channels for development and production means there is an application key for trusted peers and one for public peers.

The development key can remain unreleased, so that `pear run <dev key>` loads the latest staged changes by default.

The production key's releases can be marked, so that `pear run <production key>` loads the latest stable release by default.

## Step 2: Marking a Release

Create a new release point with the latest staged changes on the production channel by running.

```
pear release production
```


Run `pear release help` for more info on the command.


Keep in mind that changes to an application can only propagate to peers when the application is being seeded:

```
pear seed production
```

## Step 3: Running staged from a released app

After marking a release, make a trivial change to the project (e.g. add a `console.log(...)` somewhere).

First verify that it works by running `pear dev`.

Now stage the change with `pear stage production`.

Opening the application with `pear run <key>` will **not** output the log, because it loads the latest **marked** release.

The latest staged changes of a released application can be previewed with the `--checkout` flag:

```
pear run <key> --checkout=staged
```

The value of the `--checkout` flag may be `staged`, `released` (the default) or a number referring to a specific version length.

## Discussion

### The dump-stage-release strategy

A development application key can be shared among trusted peers. At that point, it could be referred to as an internal application key (internal to the group of peers who have the key).

While using different channel names is sensible, using `pear stage dev` and `pear stage production` on the same machine has practical implications.

A dump-stage-release strategy seperates the concerns between development and production, by using a different machine for each.

On the machine that holds the production key, run:

```
pear dump <internal-key> <path-to-app-production-dir>
```

This is a reverse stage: it synchronizes the application files to disk.

Once complete, the project can be staged from the production machine with:

```
pear stage production
```

Then released with:

```
pear release production
```

To allow other peers access to the new release, run `pear seed production`.

### Distribution Packages

Asset building of distribution packages (.dmg, .msi, .appimage) is not yet possible with Pear, but will be supported in the future.

## Next

* [Starting a Pear Desktop Project](./starting-a-pear-desktop-project.md)
* [Making a Pear Desktop Application](./making-a-pear-desktop-app.md)
* [Starting a Pear Terminal Project](./starting-a-pear-terminal-project.md)
* [Making a Pear Terminal Application](./making-a-pear-terminal-app.md)
* [Sharing a Pear Application](./sharing-a-pear-app.md)