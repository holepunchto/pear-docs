# Getting Started with Pear

## Requirements

Pear runs on Windows, Mac and Linux.

The `pear` CLI can be installed from [npm](https://www.npmjs.com/), which comes with [`node`](https://nodejs.org/en/about). 

The `npm` package manager can also be used to install application dependencies later on.

On MacOS and Linux, we recommend installing `node` using [`nvm`](https://github.com/nvm-sh/nvm#installing-and-updating)

On Windows we recommend installing `node` with [`nvs`](https://github.com/jasongin/nvs#setup).

> Info: The Pear Runtime does not rely on `node`, `node` is only needed to install and run the `npm` package manager.

## Setup

To install Pear run the following command:

```sh
npm i -g pear
```

To complete the setup, run the `pear` command.

```
pear
```

If a Pear application, such as [Keet](https://keet.io), is already installed on a machine then the Pear
platform is already available. In this case, running `pear` should show help output.
 
If not, the first run of `pear` will fetch the platform from peers, after which running `pear` again should output help information.

To check that Pear is fully working, try the following command:

```
pear launch keet
```

Pear loads applications from peers, so this command should launch [Keet](https://keet.io) whether or not it was downloaded and installed beforehand.


## Next

* [Making a Pear App](./making-a-pear-app.md)