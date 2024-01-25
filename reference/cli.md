# Command Line Interface (CLI)

The Command Line Interface is the primary interface for Pear Development.

## pear init [dir]

Create initial project files.

```
  --yes|-y      Autoselect all defaults
```
  
## pear dev [dir] -- [...args]

Start a project in development mode.

Edit project files on disk.

Arguments supplied after a double-dash (`--`) are passed as `pear.config.args`.

Using `--link` instead of arguments allows for application invite links.

A Pear link takes the form: `pear://<key>/<data>`.
The `<data>` portion of the link is available as `pear.config.linkData`.

```
  --no-watch       Disable watch-reload
  --launch=key     Launch an app in dev mode
  --link=url       Simulate deep-link click open
  --store|-s=path  Set the Application Storage path
  --tmp-store|-t   Use a temporary Application Storage path
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
  
## pear run <key> -- [...args]

Run an application from a key.

The key argument may also be a a Pear Link containing the key.

A Pear Link takes the form: `pear://<key>/<data>`.

The `<data>` portion of the link is available as `pear.config.linkData`.

Arguments supplied after a double-dash (`--`) are passed as `pear.config.args`.

```
  --dev                      Run the app in dev mode
  --store|-s=path            Set the Application Storage path
  --tmp-store|-t             Automatic new tmp folder as store path
  --checkout=n               Run a checkout, n is version length
  --checkout=release         Run checkout from marked released length
  --checkout=staged          Run checkout from latest version length
```
  
## pear release <channel|key> [dir]

Set production release version.

Set the release pointer against a version (default latest).

Use this to indicate production release points.

```
  --json                   Newline delimited JSON output
  --checkout=n|current     Set a custom release length (version)
```
  
## pear info <key>

Get metadata for a key.

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
  
## pear use <key>

Switch to a different platform release-line.

## pear versions

Output version information.

```
--json        Single JSON object
```
  
  
