# Command Line Interface

The Pear Command Line Interface (CLI) is a developer tool for building and sharing Pear applications.

## `pear init [dir]`

Intializes the Pear project with `package.json` and an entry file (`index.html`).

| Flag        | Description              |
| ----------- | ------------------------ |
| --yes \| -y | Autoselect all defaults. |

## `pear dev [dir]`

Launches a Pear project in development mode. 

{% hint style="info" %}
Applications are loaded from the filesystem in development mode, whereas in production from the P2P data-structures.
{% endhint %}

| Flag               | Description                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| --no-watch         | Disables watch-reload. In development mode, watch-reload is a feature that automatically reloads application file when changes are detected.      |
| --launch=key       | An application is launched in dev mode using its key.                                                                                |
| --link=url         | Simulates opening application with given deep link.                                                                                            |
| --store \| -s=path | Sets the path for the application storage.                                                                                           |
| --tmp-store \| -t  | Automatically uses a new temporary folder as the store path. This is useful for temporary or disposable storage during testing.  |

## `pear stage <channel|key> [dir]`

Stages the application from filesystem to P2P data-structure with a given channel name or key. This can be used continuously deploy a staging preview version of a Pear project. When staging, the CLI prints the difference between of current and previous version, along with the project key.

A new key is generated for that channel when staging to a channel for the first time.

{% hint style="info" %}
Applications are loaded from the filesystem in development mode, whereas in production from the P2P data-structures
{% endhint %}

| Flag            | Description                                                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| --json          | Provides the output in a newline delimited JSON.                                                                                   |
| --dry-run \| -d | Executes a trial run of the stage without writing the changes.                                                                     |
| --bare \| -b    | Turn off warmup optimization, file data only. Useful for staging apps.                                                             |
| --ignore        | Comma separated file path ignore list. Used to define a list of file paths that should be ignored during the staging process.      |
| --name          | Advanced. Override app name.                                                                                                       |

## `pear seed <channel|key> [dir]`

Seeds or reseeds a Pear project. 

For seeding a staged project, specify a staged channel from a project folder. For reseeding, specify a public key of a project.

{% hint style="info" %}
Seeding in Pear refers to the process of updating a Pear project data to/from other P2P data-structure or channels.
{% endhint %}

| Flag            | Description                                   |
| --------------- | --------------------------------------------- |
| --json          | Output is provided in newline delimited JSON. |
| --seeders \| -s | Additional public keys to seed from.          |
| --verbose \| -v | Verbose mode.                                 |
| --name          | Advanced. Override app name.                  |

## `pear launch <key>`

Launches a Pear application using its key.

| Flag                              | Description      |
| --------------------------------- | ---------------- |
| --dev                             | Launches the app in dev mode.                 |
| --store \| -s=path                | Sets the path for the Application Storage.    |
| --tmp-store \| -t                 | Automatically uses a new temporary folder as the store path. This is useful for temporary or disposable storage during testing.                                          |
| --checkout=n \| release \| staged | Launchs a specific version of the application specifying a version (n) or using keywords like release or staged for the latest release or staged version. |

## `pear release <channel|key> [dir]`

Adds a release tag for a given version (release length) to the Pear Project with the specified channel or key.

The release pointer is set against a version (default latest).

Indicates production release points.
| Flag | Description |
| ------------ | ------------------------------------------------------- |
| --json | Output is provided in newline delimited JSON. |
| --checkout=n | Default: current checkout. Set a custom release length. |

## `pear info <key>`

Prints the metadata of an Pear project such as name, channel, and release version by performing lookup from the key. 

| Flag   | Description                                   |
| ------ | --------------------------------------------- |
| --json | Output is provided in newline delimited JSON. |

## `pear dump <key> <dir>`

Dumps the Pear project's data into a local directory from remote P2P data-structures using its key.

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
