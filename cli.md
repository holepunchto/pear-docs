# Command Line Interface

The Pear Command Line Interface (CLI) is a developer tool for making and sharing Pear applications.

Following commands are available in the Pear CLI:

## `pear init [dir]`

Set up the initial files and structure for a new Pear project.

A Pear project **must** have a `package.json` file and an entry file (`index.html`). The `pear init` command helps generate these files.

| Flag        | Description              |
| ----------- | ------------------------ |
| --yes \| -y | Autoselect all defaults. |

## `pear dev [dir]`

Launch a Pear project in development mode.

In development mode, applications load from the filesystem, while in production, Pear applications load from P2P storage structures.

| Flag               | Description                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| --no-watch         | Disables watch-reload. In development mode, watch-reload is a feature that automatically reloads the application when changes are detected. |
| --launch=key       | Launch an application in dev mode using its key.                                                                                            |
| --link=url         | Simulate app opened with given deep link.                                                                                                   |
| --store \| -s=path | Sets the path for the Application Storage.                                                                                                  |
| --tmp-store \| -t  | Automatically uses a new temporary folder as the store path. This is useful for temporary or disposable storage during testing.             |

## `pear stage <channel|key> [dir]`

Staging involves preparing a Pear project for deployment by updating local changes to P2P data-structure with a given channel or key.

The channel name must be specified when running stage command for the first time, in order to generate the initial key.

This helps to continuously deploy a staging preview version of a Pear project.

On running, the CLI outputs difference information between the current and previous version, along with the project key..

| Flag            | Description                                                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| --json          | Newline delimited JSON output.                                                                                                     |
| --dry-run \| -d | Execute a stage without writing. Used to perform a trial run of the staging process without making any actual changes to the data. |
| --bare \| -b    | Turn off warmup optimization, file data only. Useful for staging apps.                                                             |
| --ignore        | Comma separated file path ignore list. Used to define a list of file paths that should be ignored during the staging process.      |
| --name          | Advanced. Override app name.                                                                                                       |

## `pear seed <channel|key> [dir]`

Seed or reseed a Pear project.

Seeding in Pear refers to the process of adding or updating a Pear project with data from other P2P data-structure or channels.

For seeding a staged project, specify a staged channel from a project folder.

For reseeding, specify a public key (or punch link) of a project.

| Flag            | Description                          |
| --------------- | ------------------------------------ |
| --json          | Newline delimited JSON output.       |
| --seeders \| -s | Additional public keys to seed from. |
| --verbose \| -v | Verbose mode.                        |
| --name          | Advanced. Override app name.         |

## `pear launch <key>`

Launch a Pear application using its key.

| Flag                              | Description                                                                                                                                                           |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| --dev                             | Launch the app in dev mode.                                                                                                                                           |
| --store \| -s=path                | Sets the path for the Application Storage.                                                                                                                            |
| --tmp-store \| -t                 | Automatically uses a new temporary folder as the store path. This is useful for temporary or disposable storage during testing.                                       |
| --checkout=n \| release \| staged | Launches a specific version of the application. You can specify a version (n), or use keywords like release or staged to launch the latest release or staged version. |

## `pear release <channel|key> [dir]`

Command adds a release tag for a given version (release length) to the Pear Project with the specified channel or key.

Set the release pointer against a version (default latest).

Use this to indicate production release points.

| Flag         | Description                                             |
| ------------ | ------------------------------------------------------- |
| --json       | Newline delimited JSON output.                          |
| --checkout=n | Default: current checkout. Set a custom release length. |

## `pear info <key>`

Lookup metadata for an application by its key.

It provides details about the application from specified key, offering insights into the associated Pear project or application, including its name, channel, and release version.

| Flag   | Description                    |
| ------ | ------------------------------ |
| --json | Newline delimited JSON output. |

## `pear dump <key> <dir>`

Synchronize files from a specified key to a specified directory.

The `pear dump` command can `remotely` extract data from a Pear Project to a local directory.

| Flag         | Description                                  |
| ------------ | -------------------------------------------- |
| --json       | Newline delimited JSON output.               |
| --checkout=n | Dump from a custom release length (version). |

# Advanced

These advanced commands here for internal development, platform debugging and power users.

## `pear sidecar`

When any Pear command is executed, it first starts and or connects to the Pear Sidecar. The Pear Sidecar is a local-running HTTP and IPC server which provides access to the P2P data-structures (Hypercores) that contain Pear Applications.

| Flag             | Description                                                                                           |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| --mem            | Memory mode: RAM corestore. Sidecar would run in memory mode, utilizing RAM for corestore operations. |
| --attach-boot-io | Include initial Sidecar I/O. (if applicable)                                                          |

## `pear repl`

Open a Read-Evaluate-Print-Loop (REPL) session with the Sidecar. It prints a command that you can run to open the session

## `pear versions`

Outputs versions of Pear and its dependencies.

| Flag   | Description                            |
| ------ | -------------------------------------- |
| --json | The CLI outputs in single JSON object. |
