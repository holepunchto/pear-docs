# drives

CLI to download, seed, and mirror a Hyperdrive or Localdrive.

>[GitHub (drives)](https://github.com/holepunchto/drives)

* [Installation](drives.md#installation)
* [Basic usage](drives.md#basic-usage)

### Installation

Install with [npm](https://www.npmjs.com/):

```bash
npm install -g drives
```

### Basic usage

```bash
drives [command] [options]
```

Commands:

| Command  | Options                       | Description                           |
| -------- | ----------------------------- | ------------------------------------  |
| init     |                               | Initializes a new storage on the cwd  |
| touch    | [options]                     | Create a writable Hyperdrive          |
| mirror   | [options] <src> <dst>         | Mirror a drive into another drive     |
| ls       | [options] <src> [path]        | List files of the drive               |
| seed     | [options] [key]               | Share a Hyperdrive                    |
| download | [options] <key>               | Archive download a Hyperdrive by key  |
| serve    | [options] <src>               | Creates a HTTP drive server           |
| put      | [options] <src> <path> <blob> | Create a file                         |
| entry    | [options] <src> <path>        | Show a single entry file              |
| get      | [options] <src> <path>        | Show the file content                 |
| rm       | [options] <src> <path>        | Delete a file                         |
| info     | [options] <key>               | Show info about the Hyperdrive        |
| purge    | [options] <key>               | Delete all local storage of the drive |

## API
Use `drives --help` for more information, `drives mirror --help`, etc.

#### Storage

By default, it tries to use `.drives` from the current directory.

If it doesn't exists then it will go back `../` until it finds an existing `.drives`.

If it doesn't find anything, then it will create and use a global folder at `~/.drives`.

You can always set `--storage [path]` to force a different location.

#### Initialize
It creates the `.drives` storage folder in the current working directory.

```bash
drives init
# Notice: new storage at /home/user/Desktop/my-project/.drives/corestore
```

Useful to avoid doing a parent lookup, and not using the home folder.

#### Create a writable Hyperdrive
```bash
drives touch
# New drive: <z32 key>
```

#### Mirror any drive into another
Source and destination can be a folder path or a drive key.

```bash
drives mirror <src> <dst>
```

Use `--live` for real-time mirroring.

Use `--dry-run` to disable writing changes. There is `--help` for more.

Note: it ignores `.drives`, `.git`, `.github`, `.DS_Store`, and `package-lock.json` entries.

#### List files
```bash
drives ls <key or path>
```

#### Share a drive
```bash
drives seed [my-drive-key]
```

#### Archive download a Hyperdrive

Continuous `download` with all past historical states, useful to checkout on older versions:

```bash
drives download <my-drive-key>
```

#### Serve a drive via HTTP
```bash
drives serve <key or path>
# HTTP server on http://localhost:5000
```

URL requests are like `/path/to/file`, i.e. `http://localhost:5000/index.js`.

For security, requests to `/.drives/*` are rejected, so mind the storage location!

#### Show storage size, version, etc
```bash
drives info <my-drive-key>
```
