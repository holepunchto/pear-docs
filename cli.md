# Command Line Interface

The Pear Command Line Interface (CLI) is a developer tool for building and sharing Pear applications.

## `pear init [dir]`

Initializes the Pear project with `package.json` and an entry file (`index.html`).

| Flag        | Description              |
| ----------- | ------------------------ |
| --yes \| -y | Autoselect all defaults. |

## `pear dev [dir]`

Launches a Pear project in development mode.

{% hint style="info" %}
Applications are loaded from the filesystem in development mode, whereas in production, they are loaded from the P2P data-structures.
{% endhint %}

| Flag               | Description                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| --no-watch         | Disables the watch-reload feature, which automatically reloads application file when changes are detected.                           |
| --launch=key       | Launches an application in dev mode using its key.                                                                                   |
| --link=url         | Simulates opening an application with the given deep link.                                                                           |
| --store \| -s=path | Sets the path for the application storage.                                                                                           |
| --tmp-store \| -t  | Uses a new temporary folder as the store path automatically. Useful for temporary or disposable storage during testing.              |

## `pear stage <channel|key> [dir]`

Stages the application from the filesystem to a P2P data-structure with a given channel name or key. This is used to continuously deploy a staging preview version of a Pear project. When staging, the CLI prints the difference between the current and previous versions, along with the project key.

A new key is generated when staging to a channel for the first time.

{% hint style="info" %}
Applications are loaded from the filesystem in development mode, whereas in production, they are loaded from the P2P data-structures.
{% endhint %}

| Flag            | Description                                                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| --json          | Outputs the staging result in newline-delimited JSON format.                                                                       |
| --dry-run \| -d | Performs a trial run of the stage without writing any changes.                                                                     |
| --bare \| -b    | Disables warmup optimization, staging only the file data. Useful for apps.                                                        |
| --ignore        | Specifies a comma-separated list of file paths to ignore during the staging process.                                               |
| --name          | Advanced: Overrides the app name.                                                                                                  |

## `pear seed <channel|key> [dir]`

Seeds or reseeds a Pear project.

For seeding a staged project, specify a staged channel from a project folder. For reseeding, specify the public key of a project.

{% hint style="info" %}
Seeding in Pear refers to the process of updating Pear project data to or from other P2P data-structures or channels.
{% endhint %}

| Flag            | Description                                   |
| --------------- | --------------------------------------------- |
| --json          | Outputs in newline-delimited JSON format.     |
| --seeders \| -s | Specifies additional public keys to seed from.|
| --verbose \| -v | Enables verbose mode.                         |
| --name          | Advanced: Overrides the app name.             |

## `pear launch <key>`

Launches a Pear application using its key.

| Flag                              | Description                                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------------- |
| --dev                             | Launches the app in development mode.                                                            |
| --store \| -s=path                | Sets the path for the Application Storage.                                                       |
| --tmp-store \| -t                 | Uses a new temporary folder as the store path automatically. Useful for temporary storage during testing. |
| --checkout=n \| release \| staged | Launches a specific version of the application by specifying a version number or using keywords like 'release' or 'staged' for the latest release or staged version. |

## `pear release <channel|key> [dir]`

Adds a release tag to the Pear Project for a given version to the specified channel or key.

The release pointer is set against a version (default is the latest).

Indicates production release points.

| Flag            | Description                                                |
| --------------- | ---------------------------------------------------------- |
| --json          | Outputs in newline-delimited JSON format.                  |
| --checkout=n    | Default: current checkout. Sets a custom release length.   |

## `pear info <key>`

Prints metadata of a Pear project, such as name, channel, and release version, by looking up the key.

| Flag   | Description                                   |
| ------ | --------------------------------------------- |
| --json | Outputs in newline-delimited JSON format.     |

## `pear dump <key> <dir>`

Dumps a Pear project's data into a local directory from remote P2P data-structures using its key.

| Flag         | Description                                   |
| ------------ | --------------------------------------------- |
| --json       | Outputs in newline-delimited JSON format.     |
| --checkout=n | Dumps from a custom release length (version). |

# Advanced Commands

These advanced commands are provided for internal development, platform debugging, and power users.

## `pear sidecar`

Starts a sidecar when for Pear applications to connect to. The Pear Sidecar is a locally-running HTTP and IPC server that provides access to P2P data-structures (Hypercores) containing Pear Applications.

| Flag             | Description                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| --mem            | Runs the Sidecar in memory mode, utilizing RAM for corestore operations.                             |
| --attach-boot-io | Includes initial Sidecar I/O if applicable.                                                          |

## `pear repl`

Opens a Read-Evaluate-Print-Loop (REPL) session with the Sidecar. Provides a command to run for opening the session.

## `pear versions`

Displays versions of Pear and its dependencies.

| Flag   | Description                                 |
| ------ | ------------------------------------------- |
| --json | Outputs in a single JSON object.            |
