# Command Line Interface (CLI) 

<mark style="background-color: #8484ff;">**experimental**</mark>

The Command Line Interface is the primary interface for Pear Development.

Legend:

- `link`  
  All `link` arguments can be a `pear://` link, a `file://` link or a file path.
  See [Pear Link Specification](./link-specification.md) for more details on `pear://` links.
- `dir`  
  Refers to a file path. Usually this is the root directory of the project.
- `<>`  
  An argument wrapped in `<>`s is a required argument.
- `[]`  
  An argument wrapped in `[]`s is an optional argument.

## `pear init [flags] [link|name] [dir]`

Create initial project files.

Names: default, ui, node-compat

> Default Project directory path is `.`

Template can also be initialized from a [pear:// link](./link-specification.md), the template should contain a `_template.json` file. This file defines the prompts which are converted to locals that are injected into the template.

```
--yes|-y                  Autoselect all defaults
--force|-f                Force overwrite existing files
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

## `pear stage [flags] <channel|link> [dir]`

Synchronize local changes to channel or link.

Channel name must be specified on first stage,
in order to generate the initial key.

Outputs diff information and project link.

```
  --dry-run|-d                Execute a stage without writing
  --ignore <list>             Comma separated file path ignore list
  --purge                     Remove ignored files if present in previous stage
  --only <paths>              Filter by paths. Comma-separated
  --truncate <n>              Advanced. Truncate to version length n
  --name                      Advanced. Override app name
  --no-ask                    Suppress permissions dialogs
  --no-pre                    Skip pre scripts
  --preio                     Show stdout & stderr of pre scripts
  --prequiet                  Suppress piped output of pre scripts
  --json                      Newline delimited JSON output
  --help|-h                   Show help
```
  
## `pear seed <channel|link> [dir]`

Seed or reseed a project.

Specify channel or link to seed a project or a remote link to reseed.

```
  --verbose|-v              Additional output
  --name                    Advanced. Override app name
  --no-ask                  Suppress permissions dialogs
  --json                    Newline delimited JSON output
  --help|-h                 Show help
```
  
## `pear run [flags] <link|dir> [...app-args]`

Run an application from a `link` or `dir`.

While developing an application, `link` will usually be a relative file path for the root directory (eg `.`).

|       |                                                   |
|-------|---------------------------------------------------|
| link  | `pear://<key>`  \| `pear://<alias>`                |
| dir   | `file://<absolute-path>` \| `<absolute-path>` \| `<relative-path>` |


```
  --dev|-d                       Enable --devtools & --updates-diff
  --devtools                     Open devtools with application [Desktop]
  --updates-diff                 Enable diff computation for Pear.updates
  --no-updates                   Disable updates firing via Pear.updates
  --link <url>                   Simulate deep-link click open
  --store|-s <path>              Set the Application Storage path
  --tmp-store|-t                 Automatic new tmp folder as store path
  --links <kvs>                  Override configured links with comma-separated key-values
  --chrome-webrtc-internals      Enable chrome://webrtc-internals
  --unsafe-clear-app-storage     Clear app storage
  --unsafe-clear-preferences     Clear preferences (such as trustlist)
  --appling <path>               Set application shell path
  --checkout <n|release|staged>  Run a checkout from version length
  --detached                     Wakeup existing app or run detached
  --no-ask                       Suppress permissions dialogs
  --follow-symlinks|-f           Follow in-project symlinks
  --no-pre                       Skip pre scripts
  --preio                        Show stdout & stderr of pre scripts
  --prequiet                     Suppress piped output of pre scripts
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

Use this to indicate production release points.

```
  --checkout <n>           Set release checkout n is version length
  --json                   Newline delimited JSON output
  --help|-h                Show help
```
  
## `pear info [link|channel] [dir]`

View project information.

Supply a link or channel to view application information.

Supply no argument to view platform information.

```
  --changelog               View changelog only
  --full-changelog          Full record of changes
  --metadata                View metadata only
  --manifest                View app manifest only
  --key                     View link only
  --no-ask                  Suppress permissions dialogs
  --json                    Newline delimited JSON output
  --help|-h                 Show help
```
  
## `pear dump [flags] <link> <dir>`

Synchronize files from link to dir.

The link maybe be a `file:`, `pear:` URL or a directory.

To dump to stdout use `-` in place of `<dir>`

```
  --dry-run|-d              Execute a dump without writing
  --checkout <n>            Dump from specified checkout, n is version length
  --only <paths>            Filter by paths. Implies --no-prune. Comma-seperated
  --force|-f                Force overwrite existing files
  --list                    List paths at link. Sets <dir> to -
  --no-ask                  Suppress permissions dialogs
  --no-prune                Prevent removal of existing paths
  --json                    Newline delimited JSON output
  --help|-h                 Show help
```
  
## `pear touch [flags] [channel]`

Ensure Pear link.

Initialize a project Pear link if it doesn't already exist.

Creates a Pear Link using channel name if provided or else a randomly generated channel name.

This command is useful for creating links for automations that use `pear stage <link>`, `pear release <link>` or `pear seed <link>`.

```
  --json      Newline delimited JSON output
  --help|-h   Show help
```

## `pear sidecar [flags] [command]`

The Pear Sidecar is a local-running IPC server which
provides access to corestores.

This command instructs any existing sidecar process to shutdown
and then becomes the sidecar.

| Commands | Description                       |
| -------- | --------------------------------- |
| shutdown | Shutdown running sidecar and exit |

```
  --key <key>           Advanced. Switch release lines
  --log-level <level>   Level to log at. 0,1,2,3 (OFF,ERR,INF,TRC)
  --log-labels <list>   Labels to log (internal, always logged)
  --log-fields <list>   Show/hide: date,time,h:level,h:label,h:delta
  --log-stacks          Add a stack trace to each log message
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
--help|-h   Show help
```

## `pear gc [flags] [command]`

Perform garbage collection and remove unused resources.

| Commands   | Description             |
| -------    | ----------------------- |
| releases   | Clear inactive releases |
| sidecars   | Clear running sidecars  |
| interfaces | Clear unused interfaces |

```
  --json        Newline delimited JSON output
  --help|-h     Show help
```

### `pear gc interfaces [flags] [command]`

Clear unused interfaces.

```
  --age <ms>    Newline delimited JSON output
  --help|-h     Show help
```

## `pear data [flags] [command]`

Explore platform contents.

This command outputs the internal database which contains metadata stored on this device used by the Pear runtime.

| Commands | Description                  |
| -------- | ---------------------------- |
| apps     | Installed apps               |
| dht      | DHT known-nodes cache        |
| gc       | Garbage collection records   |
| manifest | Database internal versioning |
| assets   | On-disk assets for app       |

```
--secrets   Show sensitive information, i.e. encryption-keys
--json      Newline delimited JSON output
--help|-h   Show help
```

### `pear data apps [flags] [link]`

List installed apps, filtered by `[link]` if provided.

### `pear data dht [flags]`

List the cached DHT known-nodes.

### `pear data gc [flags]`

List garbage collection records.

### `pear data manifest [flags]`

Get internal database versioning.

### `pear data assets [flags] [link]`

List on-disk assets for the app(s), filtered by `[link]` if provided.

## `pear drop [flags] [command]`

Permanently delete application data.

| Commands | Description                           |
| -------  | ------------------------------------- |
| app      | Reset an application to initial state |

```
  --json        Newline delimited JSON output
  --help|-h     Show help
```

### `pear drop app [flags] [link]`

Reset an application to its initial state.

Clears the application storage for the supplied link.
