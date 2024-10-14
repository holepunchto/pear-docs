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
--encryption-key=name     Application encryption key
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
## `pear stage <channel|key> [dir]`

Synchronize local changes to key.

Channel name must be specified on first stage,
in order to generate the initial key.

Outputs diff information and project key.

```
  --json                      Newline delimited JSON output
  --dry-run|-d                Execute a stage without writing
  --bare|-b                   File data only, no warmup optimization
  --ignore                    Comma separated file path ignore list
  --name                      Advanced. Override app name
  --encryption-key=name       Application encryption key
  --no-ask                    Suppress permissions dialogs
  --help|-h                   Show help
```
  
## `pear seed <channel|key> [dir]`

Seed project or reseed key.

Specify channel or key to seed a project.

Specify a remote key to reseed.

```
  --json                    Newline delimited JSON output
  --seeders|-s              Additional public keys to seed from
  --name                    Advanced. Override app name
  --verbose|-v              Additional output
  --encryption-key=name     Application encryption key
  --no-ask                  Suppress permissions dialogs
  --help|-h                 Show help
```
  
## `pear run [flags] <link|dir> [...app-args]`

Run an application from a key or dir.

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
  --unsafe-clear-preferences     Clear preferences (such as trustlist)
  --appling=path                 Set application shell path
  --checkout=n                   Run a checkout, n is version length
  --checkout=release             Run checkout from marked released length
  --checkout=staged              Run checkout from latest version length
  --no-ask-trust                 Exit instead of asking to trust unknown keys
  --detached                     Wakeup existing app or run detached
  --encryption-key=name          Application encryption key
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

## `pear release <channel|key> [dir]`

Set production release version.

Set the release pointer against a version (default latest).

Use this to indicate production release points.

```
  --json                   Newline delimited JSON output
  --checkout=n|current     Set a custom release length (version)
  --help|-h                Show help
```
  
## `pear info [channel|key]`

Read project information.

Supply a key or channel to view application information.

Supply no argument to view platform information.

```
  --changelog               View changelog only
  --full-changelog          Full record of changes
  --metadata                View metadata only
  --key                     View key only
  --json                    Newline delimited JSON output
  --encryption-key=name     Application encryption key
  --no-ask                  Suppress permissions dialogs
  --help|-h                 Show help
```
  
## `pear dump [flags] <link> <dir>`

Synchronize files from key to dir.

> To dump to stdout use `-` in place of `<dir>`

```
  --checkout=n              Dump from specified checkout, n is version length
  --json                    Newline delimited JSON output
  --encryption-key=name     Application encryption key
  --no-ask                  Suppress permissions dialogs
  --help|-h                 Show help
```
  
## `pear touch [flags] [channel]`

Create Pear link

Creates a Pear Link using channel name if provided or else a randomly generated channel name.

This command is useful for creating links for automations that use `pear stage <link>` or `pear release <link>`.

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
  --verbose|-v     Additional output
  --mem            memory mode: RAM corestore
  --key=key        Advanced. Switch release lines
  --help|-h        Show help
```

## `pear versions`

Output version information.

```
--json        Single JSON object
--help|-h     Show help
```

## `pear shift <src-key> <dst-key> [--force]`

Move user application storage between applications.

```
--force     Overwrite existing application storage if present
--json      Newline delimited JSON output
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


  
