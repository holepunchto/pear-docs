# Command Line Interface

The Pear Command Line Interface (CLI) is a developer tool for building and sharing Pear applications.

Following commands are available in the Pear CLI:

## `pear init [dir]`

The initial files and structure for a new Pear project are set up.

A Pear project **must** be provided with a `package.json` file and an entry file (`index.html`). These files are generated with the assistance of the `pear init` command.

| Flag        | Description              |
| ----------- | ------------------------ |
| --yes \| -y | Autoselect all defaults. |

## `pear dev [dir]`

A Pear project is launched in development mode.

Applications are loaded from the filesystem in development mode, whereas in production from the P2P data-structures.

| Flag               | Description                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| --no-watch         | The watch-reload feature is disabled. This feature, when enabled, automatically reloads the application upon detecting changes.      |
| --launch=key       | An application is launched in dev mode using its key.                                                                                |
| --link=url         | Simulate app opened with given deep link.                                                                                            |
| --store \| -s=path | Sets the path for the Application Storage.                                                                                           |
| --tmp-store \| -t  | A new temporary folder is automatically used as the storage path. This is useful for temporary or disposable storage during testing. |

## `pear stage <channel|key> [dir]`

Staging involves preparing a Pear project for deployment by updating local changes to P2P data-structure with a given channel or key.

The channel name must be specified when running stage command for the first time, in order to generate the initial key.

This helps to continuously deploy a staging preview version of a Pear project.

On running, the CLI outputs the difference between the current and previous version, along with the project key.

| Flag            | Description                                                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| --json          | Output is provided in newline delimited JSON.                                                                                      |
| --dry-run \| -d | Execute a stage without writing. Used to perform a trial run of the staging process without making any actual changes to the data. |
| --bare \| -b    | Turn off warmup optimization, file data only. Useful for staging apps.                                                             |
| --ignore        | Comma separated file path ignore list. Used to define a list of file paths that should be ignored during the staging process.      |
| --name          | Advanced. Override app name.                                                                                                       |

## `pear seed <channel|key> [dir]`

Seed or reseed a Pear project.

Seeding in Pear refers to the process of adding or updating a Pear project with data from other P2P data-structure or channels.

For seeding a staged project, specify a staged channel from a project folder.

For reseeding, specify a public key of a project.

| Flag            | Description                                   |
| --------------- | --------------------------------------------- |
| --json          | Output is provided in newline delimited JSON. |
| --seeders \| -s | Additional public keys to seed from.          |
| --verbose \| -v | Verbose mode.                                 |
| --name          | Advanced. Override app name.                  |

## `pear launch <key>`

Launch a Pear application using its key.

| Flag                              | Description                                                                                                                                                              |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| --dev                             | Launch the app in dev mode.                                                                                                                                              |
| --store \| -s=path                | Sets the path for the Application Storage.                                                                                                                               |
| --tmp-store \| -t                 | Automatically uses a new temporary folder as the store path. This is useful for temporary or disposable storage during testing.                                          |
| --checkout=n \| release \| staged | A specific version of the application is launched, either by specifying a version (n) or using keywords like release or staged for the latest release or staged version. |

## `pear release <channel|key> [dir]`

A release tag for a given version (release length) is added to the Pear Project with the specified channel or key.

The release pointer is set against a version (default latest).

Indicates production release points.
| Flag | Description |
| ------------ | ------------------------------------------------------- |
| --json | Output is provided in newline delimited JSON. |
| --checkout=n | Default: current checkout. Set a custom release length. |

## `pear info <key>`

Metadata for an application is looked up by its key.

Details about the application from the specified key are provided, offering insights into the associated Pear project, including its name, channel, and release version.

| Flag   | Description                                   |
| ------ | --------------------------------------------- |
| --json | Output is provided in newline delimited JSON. |

## `pear dump <key> <dir>`

Files synchronize from a specified key to a designated directory.

The `pear dump` command can remotely extract data from a Pear Project to a local directory.

| Flag         | Description                                   |
| ------------ | --------------------------------------------- |
| --json       | Output is provided in newline delimited JSON. |
| --checkout=n | Dump from a custom release length (version).  |

# Advanced

These advanced commands are provided here for internal development, platform debugging, and power users.

## `pear sidecar`

When any Pear command is executed, it first starts and or connects to the Pear Sidecar. The Pear Sidecar is a local-running HTTP and IPC server that provides access to the P2P data-structures (Hypercores) containing Pear Applications.

| Flag             | Description                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| --mem            | Memory mode: RAM corestore. The Sidecar runs in memory mode, utilizing RAM for corestore operations. |
| --attach-boot-io | Initial Sidecar I/O is included. (if applicable)                                                     |

## `pear repl`

A Read-Evaluate-Print-Loop (REPL) session with the Sidecar is opened. A command is printed that can be run to open the session.

## `pear versions`

Outputs versions of Pear and its dependencies.

| Flag   | Description                                 |
| ------ | ------------------------------------------- |
| --json | Output is provided in a single JSON object. |
