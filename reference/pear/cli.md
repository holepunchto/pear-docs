# Command Line Interface (CLI) 

<mark style="background-color: #8484ff;">**experimental**</mark>

The Command Line Interface is the primary interface for Pear Development.

## `pear init [flags] <link|type=desktop> [dir]`

Create initial project files.

Template Types: desktop, terminal, terminal-node

> Default Project directory path is `.`

Template can also be initialized from a pear:// link, the template should contain a `_template.json` file. This file defines the prompts which are converted to locals that are injected into the template.

```
--yes|-y                  Autoselect all defaults
--type|-t=type            Template type. Overrides <link|type>
--force|-f                Force overwrite existing files
--with|-w=name            Additional functionality. Available: node
--no-ask                  Suppress permissions dialogs
--help|-h                 Show help
```
  
## `pear dev [flags] [dir] [...app-args]`

Run a project in development mode from disk.

> `pear dev` has been deprecated, use `pear run --dev` instead.

Alias for: `pear run --dev <dir>`

```
--link=url          Simulate deep-link click open
--store|-s=path     Set the Application Storage path
--tmp-store|-t      Automatic new tmp folder as store path
```  
## `pear stage <channel|link> [dir]`

Synchronize local changes to channel or key.

Channel name must be specified on first stage, in order to generate the initial key. This key is unique to the combination of the application name, the channel name and the device's unique corestore key. This means the key does not change after the first time the channel is staged.

Outputs diff information and project link.

Each time new changes are staged, the length for the channel / link will update, hence updating the version. This change can be replicated to any peer who know the link and is connected. If they run `pear info <link>`, they will see the `length` update even if the application is not being seeded. Connections can potentially linger after seeding an application but will eventually close.

```
  --json                      Newline delimited JSON output
  --dry-run|-d                Execute a stage without writing
  --ignore <list>             Comma separated file path ignore list
  --truncate <n>              Advanced. Truncate to version length n
  --name                      Advanced. Override app name
  --no-ask                    Suppress permissions dialogs
  --help|-h                   Show help
```
  
## `pear seed <channel|link> [dir]`

Seed project or reseed key.

Specify channel or link to seed a project or a remote link to reseed.

Seeding will sparsely replicate the application. This means the entire history of the channel or link is available, but most likely only the most recent version will be replicated. For more info, read ["Lazy loading large files & sparse replication"](./guides/sharing-a-pear-app#lazy-loading-large-files-and-sparse-replication) section in the "Sharing a Pear Application" guide.

```
  --json                    Newline delimited JSON output
  --name                    Advanced. Override app name
  --verbose|-v              Additional output
  --no-ask                  Suppress permissions dialogs
  --help|-h                 Show help
```
  
## `pear run [flags] <link|dir> [...app-args]`

Run an application from a link or dir.

|       |                                                   |
|-------|---------------------------------------------------|
| link  | `pear://<key>`  \| `pear://<alias>`                |
| dir   | `file://<absolute-path>` \| `<absolute-path>` \| `<relative-path>` |


```
  --dev|-d                       Enable --devtools & --updates-diff
  --devtools                     Open devtools with application [Desktop]
  --updates-diff                 Enable diff computation for Pear.updates
  --no-updates                   Disable updates firing via Pear.updates
  --link=url                     Simulate deep-link click open
  --store|-s=path                Set the Application Storage path
  --tmp-store|-t                 Automatic new tmp folder as store path
  --links <kvs>                  Override configured links with comma-separated key-values
  --chrome-webrtc-internals      Enable chrome://webrtc-internals
  --unsafe-clear-app-storage     Clear app storage
  --appling=path                 Set application shell path
  --checkout=n                   Run a checkout, n is version length
  --checkout=release             Run checkout from marked released length
  --checkout=staged              Run checkout from latest version length
  --detached                     Wakeup existing app or run detached
  --no-ask                       Suppress permissions dialogs
  --help|-h                      Show help
```

### Examples 

```
pear run pear://u6c6it1hhb5serppr3tghdm96j1gprtesygejzhmhnk5xsse8kmy
```

```
pear run -s /tmp/app-storage path/to/an-app-folder some --app args
```

```
pear run -t file://path/to/an-app-folder --some app --args
```

```
pear run pear://keet
```

## `pear release <channel|link> [dir]`

Set production release version.

Set the release pointer against a version (default latest).

Use this to indicate production release points. Once a channel or link has been released (setting a pointer for a given version) running the application (via `pear run <link>`) will load the application at the released version even if more changes were staged.

```
  --json                   Newline delimited JSON output
  --checkout=n|current     Set a custom release length (version)
  --help|-h                Show help
```

### Release rollbacks

Releases can generally be rolled back in one of two ways. First by updating the release pointer to a previous length using the `--checkout` flag. For example:

- Release "A" for channel `production` was at length `500`
- Release "B" for channel `production` was at length `505`

The release can be rolled back to "A" (aka length `500`) via the following command:

```console
pear release --checkout 500 production
```

This method doesn't add any file changes so will not show update diffs from the previous release version.

The second approach is dumping the files from the previous version and staging and rereleasing the new version. This appends file changes so is heavier than just changing the release pointer, but shows update diffs and fits the [dump-stage-release strategy](../../guide/releasing-a-pear-app.md) approach since updates to the `production` channel are applied by dumping from another channel or link.

## `pear info [link|channel]`

Read project information.

Supply a link or channel to view application information.

Supply no argument to view platform information.

```
  --changelog               View changelog only
  --full-changelog          Full record of changes
  --metadata                View metadata only
  --key                     View link only
  --json                    Newline delimited JSON output
  --no-ask                  Suppress permissions dialogs
  --help|-h                 Show help
```
  
## `pear dump [flags] <link> <dir>`

Synchronize files from link to dir.

> To dump to stdout use `-` in place of `<dir>`

`<link>` can contain a path portion to dump a subset of the files for the Pear application. For example, to dump only the `CHANGELOG.md` from Keet into a `dump-dir` directory run:

```
pear dump pear://keet/CHANGELOG.md dump-dir/
```

```
  --dry-run|-d              Execute a dump without writing
  --checkout=n              Dump from specified checkout, n is version length
  --json                    Newline delimited JSON output
  --force|-f                Force overwrite existing files
  --no-ask                  Suppress permissions dialogs
  --help|-h                 Show help
```
  
## `pear touch [flags] [channel]`

Create Pear link

Creates a Pear Link using channel name if provided or else a randomly generated channel name.

This command is useful for creating links for automations that use `pear stage <link>`, `pear release <link>` or `pear seed <link>`.

```
  --json      Newline delimited JSON output
  --help|-h   Show help
```

## `pear sidecar`

The Pear Sidecar is a local-running HTTP and IPC server which
provides access to corestores.

This command instructs any existing sidecar process to shutdown
and then becomes the sidecar.

```
  --mem                 memory mode: RAM corestore
  --log-level <level>   Level to log at. 0,1,2,3 (OFF,ERR,INF,TRC)
  --log-labels <list>   Labels to log (internal, always logged)
  --log-fields <list>   Show/hide: date,time,h:level,h:label,h:delta
  --log-stacks          Add a stack trace to each log message
  --log                 Label:sidecar Level:2 Fields: h:level,h:label
  --key <key>           Advanced. Switch release lines
  --help|-h             Show help
```

## `pear versions`

Output version information.

```
--json        Single JSON object
--help|-h     Show help
```

## `pear shift [flags] <source> <destination>`

Move user application storage between applications.

`<source>` and `<destination>` are links.

```
--force     Overwrite existing application storage if present
--json      Newline delimited JSON output
```

## `pear reset [flags] <link>`

Advanced. Reset an application to initial state

Clears application storage for a given application link.

WARNING: Confirmation will be requested as the storage will be deleted permanently and cannot be recovered. Use with caution.

```
--json      Newline delimited JSON output
--help|-h   Show help
```

## `pear gc [flags] [command]`

Perform garbage collection and remove unused resources.

| Commands      |           Description                                        |
|-------|---------------------------------------------------|
| releases   | Clear inactive releases                       |
| sidecars   |  Clear running sidecars                       |

```
  --json        Newline delimited JSON output
  --help|-h     Show help
```

## `pear data [flags] [command]`

View database contents.

The database contains metadata stored on this device used by the Pear runtime.

| Commands   | Description                |
| ---------- | -------------------------- |
| apps       | Installed apps             |
| dht        | DHT known-nodes cache      |
| gc         | Garbage collection records |

```
--secrets   Show sensitive information, i.e. encryption-keys
--json      Newline delimited JSON output
--help|-h   Show help
```

### `pear data apps [flags] [link]`

List installed apps, filtered by `[link]` if provided.


  
