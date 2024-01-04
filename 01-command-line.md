# Command Line Interface

The Pear Command Line Interface (CLI) is the entry point for developers. It provides access to development, deployment and production capabilities.

## `pear init [dir]`

Set up the initial files and structure for a new Pear project.

| Flag        | Description              |
| ----------- | ------------------------ |
| --yes \| -y | Autoselect all defaults. |

## `pear dev [dir]`

Launch a Pear project in development mode.

The files are loaded from disk instead of Hypercores.

| Flag               | Description                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| --no-watch         | Disables watch-reload. In development mode, watch-reload is a feature that automatically reloads the application when changes are detected. |
| --launch=key       | Launch an application in dev mode using its key.                                                                                            |
| --link=url         | Simulate app opened with given deep link.                                                                                                   |
| --store \| -s=path | Sets the path for the Application Storage. This allows you to specify where the application will store its datapath.                        |
| --tmp-store \| -t  | Automatically uses a new temporary folder as the store path. This is useful for temporary or disposable storage during testing.             |

## `pear stage <channel|key> [dir]`

Staging involves preparing a Pear project for deployment by updating local changes to Hypercores with a given channel or key.

The channel name must be specified when running stage command for first time, in order to generate the initial key.

This helps to continuously deploy a staging preview version of a Pear project.

On running, CLI outputs diff information from previous version and project key.

| Flag            | Description                                                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| --json          | Newline delimited JSON output.                                                                                                     |
| --dry-run \| -d | Execute a stage without writing. Used to perform a trial run of the staging process without making any actual changes to the data. |
| --bare \| -b    | Turn off warmup optimization, file data only. Useful for staging apps.                                                             |
| --ignore        | Comma separated file path ignore list. Used to define a list of file paths that should be ignored during the staging process.      |

## `pear seed <channel|key> [dir]`

Seed or reseed a Pear project.

Seeding in Pear refers to the process of initializing or updating a Pear project with data from other Hypercores or channels.

For seeding a staged project, specify a staged channel from a project folder.

For reseeding, specify a public key (or punch link) of a project.

| Flag            | Description                          |
| --------------- | ------------------------------------ |
| --json          | Newline delimited JSON output.       |
| --seeders \| -s | Additional public keys to seed from. |
| --verbose \| -v | Verbose mode.                        |

## `pear launch <key>`

Launch an application from Hyperspace using its key id.

| Flag                              | Description                                                                                                                                                           |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| --dev                             | Launch the app in dev mode.                                                                                                                                           |
| --store \| -s=path                | Sets the path for the Application Storage. This allows you to specify where the application will store its data.                                                      |
| --tmp-store \| -t                 | Automatically uses a new temporary folder as the store path. This is useful for temporary or disposable storage during testing.                                       |
| --checkout=n \| release \| staged | Launches a specific version of the application. You can specify a version (n), or use keywords like release or staged to launch the latest release or staged version. |

## `pear release <channel|key> [dir]`

Command adds a release tag for a given version (release length) to the Hypercores with the specified channel or key.

Set the release pointer against a version (default latest).

Use this to indicate production release points.

| Flag   | Description                    |
| ------ | ------------------------------ |
| --json | Newline delimited JSON output. |

## `pear info <key>`

Get metadata for a key.

This command provides details about the specified key, offering insights into the associated Pear project or application, including its name, channel, and release version.

| Flag   | Description                    |
| ------ | ------------------------------ |
| --json | Newline delimited JSON output. |

## `pear dump <key> <dir>`

Used to synchronize files from a specified key to a specified directory.

This command is useful for extracting or backing up data from a Pear project's Hypercore to a local directory.

| Flag         | Description                                  |
| ------------ | -------------------------------------------- |
| --json       | Newline delimited JSON output.               |
| --checkout=n | Dump from a custom release length (version). |

## `pear sidecar`

The Sidecar is a local-running process that provides access to P2P functionality.

This command instructs any existing Sidecar process to shutdown
and then becomes the Sidecar.

| Flag             | Description                                                                                                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| --mem            | Memory mode: RAM corestore. Sidecar should run in memory mode, utilizing RAM for corestore operations. Useful for testing or running a Pear application with an in-memory storage system. |
| --attach-boot-io | Include initial Sidecar I/O. (if applicable)                                                                                                                                              |

## `pear repl`

Open a Read-Evaluate-Print-Loop (REPL) session with the Sidecar. A key is printed out during the Pear REPL session, which can be used with the REPL-swarm module to establish a connection.

## `pear versions`

Outputs Pear version and versions of top level dependencies used.

| Flag   | Description                       |
| ------ | --------------------------------- |
| --json | CLI output in single JSON object. |

## Advanced

These advanced commands are for power-users helpful for internal development, and platform debugging.

#### `pear stage <channel|key> [dir]`

| Flag   | Description        |
| ------ | ------------------ |
| --name | Override app name. |

#### `pear seed <channel|key> [dir]`

| Flag   | Description        |
| ------ | ------------------ |
| --name | Override app name. |

#### `pear release <channel|key> [dir]`

| Flag         | Description                                             |
| ------------ | ------------------------------------------------------- |
| --checkout=n | Default: current checkout. Set a custom release length. |
