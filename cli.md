# Command Line Interface

The Pear Command Line Interface (CLI) is a developer tool for building and distributing Pear applications.

## `pear init [dir]`

Sets up a Pear project with a initial project files.

| Flag        | Description              |
| ----------- | ------------------------ |
| --yes \| -y | Autoselects all defaults. |

## `pear dev [dir]`

Starts a Pear project in development mode.

{% hint style="info" %}
In development mode, application files are loaded from the filesystem. In production, they are loaded from the P2P data-structures.
{% endhint %}

| Flag               | Description                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| --no-watch         | Turns off the watch-reload feature that refreshes the application automatically when file changes are detected.                         |
| --launch=key       | Launches an application in dev mode using its key.                                                                                   |
| --link=url         | Simulates opening an application with the specified deep link.                                                                           |
| --store \| -s=path | Sets the path for the application storage.                                                                                           |
| --tmp-store \| -t  | Uses a new temporary folder as the store path automatically. Useful for temporary or disposable storage during testing.              |

## `pear stage <channel|key> [dir]`

Stages the application from the filesystem to a P2P data-structure with a given channel name or key. This can be used to continuously deploy a staging preview version of a Pear project. When staging, the CLI prints the difference between the current and previous versions, along with the project key.

A new key is generated when staging to a channel for the first time.

| Flag            | Description                                                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| --json          | Outputs the staging result in newline-delimited JSON format.                                                                       |
| --dry-run \| -d | Performs a trial run of the stage without writing any changes.                                                                     |
| --bare \| -b    | Disables warmup optimization, staging only the file data.                                                                         |
| --ignore        | Specifies a comma-separated list of file paths to ignore during the staging process.                                               |
| --name          | Advanced: Overrides the app name.                                                                                                  |

## `pear seed <channel|key> [dir]`

Seeds or reseeds a Pear project. 

For seeding a staged project, specify a staged channel from a project folder. For reseeding, specify the public key of a project.

{% hint style="info" %}
Seeding in Pear refers to the process of updating Pear project data to or from other P2P data-structures.
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
| --dev                             | Launches the application in development mode.                                                            |
| --store \| -s=path                | Sets the path for the Application Storage.                                                       |
| --tmp-store \| -t                 | Uses a new temporary folder as the store path automatically. Useful for temporary storage during testing. |
| --checkout=n \| release \| staged | Launches a specific version of the application by specifying a version number or using keywords like 'release' or 'staged' for the latest release or staged version. |

## `pear release <channel|key> [dir]`

Sets the release pointer to the specified version (default is latest) in a channel.

{% hint style="info" %}
Production release points can be indicated this way.
{% endhint %}

| Flag            | Description                                                |
| --------------- | ---------------------------------------------------------- |
| --json          | Outputs in newline-delimited JSON format.                  |
| --checkout=n    | Default: current checkout. Sets a custom release length.   |

## `pear info <key>`

Retrieves and displays metadata for a Pear project, such as name, channel, and release version, by referencing the key.

| Flag   | Description                                   |
| ------ | --------------------------------------------- |
| --json | Outputs in newline-delimited JSON format.     |

## `pear dump <key> <dir>`

Dumps a Pear project's files from P2P data structures to a local directory using the project's key.

| Flag         | Description                                   |
| ------------ | --------------------------------------------- |
| --json       | Outputs in newline-delimited JSON format.     |
| --checkout=n | Dumps from a custom release length (version). |

# Advanced Commands

These advanced commands are provided for internal development, platform debugging, and power users.

## `pear sidecar`

Commands any running sidecar process to terminate before taking its place.

The Pear Sidecar is a locally-running HTTP and IPC server that provides access to P2P data-structures (Hypercores) containing Pear Applications. 

| Flag             | Description                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| --mem            | Runs the Sidecar in memory mode, utilizing RAM for corestore operations.                             |
| --attach-boot-io | Includes initial Sidecar I/O if applicable.                                                          |

## `pear repl`

Opens a Read-Evaluate-Print-Loop (REPL) session for interaction with the Sidecar and prints the key. 

Connect to this session using repl-swarm.

## `pear versions`

Displays the current versions of Pear and its dependencies.

| Flag   | Description                                 |
| ------ | ------------------------------------------- |
| --json | Outputs in a single JSON object.            |
