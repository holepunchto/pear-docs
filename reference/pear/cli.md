# Command Line Interface (CLI) 

<mark style="background-color: #8484ff;">**experimental**</mark>

The Command Line Interface is the primary interface for Pear Development.

## pear init [dir]

Create initial project files.

```
--yes|-y         Autoselect all defaults
--type|-t=type   Project type: desktop (default) or terminal
--force|-f       Force overwrite existing files
--with|-w=name   Additional functionality. Available: node
```
  
## pear dev [flags] [dir] [...app-args]

Run a project in development mode from disk.

Alias for: `pear run --dev <dir>`

```
--link=url                 Simulate deep-link click open
--store|-s=path            Set the Application Storage path
--tmp-store|-t             Automatic new tmp folder as store path
```  
## pear stage <channel|key> [dir]

Synchronize local changes to key.

Channel name must be specified on first stage,
in order to generate the initial key.

Outputs diff information and project key.

```
  --json         Newline delimited JSON output
  --dry-run|-d   Execute a stage without writing
  --bare|-b      File data only, no warmup optimization
  --ignore       Comma separated file path ignore list
  --name         Advanced. Override app name
```
  
## pear seed <channel|key> [dir]

Seed project or reseed key.

Specify channel or key to seed a project.

Specify a remote key to reseed.

```
  --json        Newline delimited JSON output
  --seeders|-s  Additional public keys to seed from
  --name        Advanced. Override app name
  --verbose|-v  Additional output
```
  
## pear run [flags] <key|dir|alias> [...app-args]

Run an application from a key or dir.

|       |                                                   |
|-------|---------------------------------------------------|
| key   | `pear://<key>`                            |
| dir   | `file://<absolute-path>` \| `<absolute-path>` \| `<relative-path>` |
| alias | `pear://<alias>`                          |


```
  --dev                      Enable --devtools & --updates-diff
  --devtools                 Open devtools with application [Desktop]
  --updates-diff             Enable diff computation for Pear.updates
  --no-updates               Disable updates firing via Pear.updates
  --link=url                 Simulate deep-link click open
  --store|-s=path            Set the Application Storage path
  --tmp-store|-t             Automatic new tmp folder as store path
  --checkout=n               Run a checkout, n is version length
  --checkout=release         Run checkout from marked released length
  --checkout=staged          Run checkout from latest version length
  --no-ask-trust             Exit instead of asking to trust unknown keys
  --detached                 Wakeup existing app or run detached
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

## pear release <channel|key> [dir]

Set production release version.

Set the release pointer against a version (default latest).

Use this to indicate production release points.

```
  --json                   Newline delimited JSON output
  --checkout=n|current     Set a custom release length (version)
```
  
## pear info [key]

Read project information.

Supply a key to view application info

Without a key pear info shows Pear info

```
  --json          Newline delimited JSON output
```
  
## pear dump <key> <dir>

Synchronize files from key to dir.

```
  --json          Newline delimited JSON output
  --checkout=n    Dump from a custom release length (version)
```
  
## pear sidecar

The Pear Sidecar is a local-running HTTP and IPC server which
provides access to corestores.

This command instructs any existing sidecar process to shutdown
and then becomes the sidecar.

```
  --mem              memory mode: RAM corestore
  --attach-boot-io   include initial sidecar I/O (if applicable)
```
  
## pear repl

Connect to a Read-Eval-Print-Loop session with sidecar.

A key is printed out, use with repl-swarm module to connect.

## pear versions

Output version information.

```
--json        Single JSON object
```
  
  
