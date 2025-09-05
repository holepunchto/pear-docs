# Frequently Asked Questions

## How Do I Get a List of Pear Applications I've Installed?

Running the following command in the terminal will list installed applications;

```console
pear data apps
```

It will return a list like the following:

```
- pear://keet
    storage: ./pear/app-storage/by-dkey/197ea022b663edbedcf0b2a0fe44ebc99c21448cb46d375ec77d95de6e0a4c1a

- pear://runtime
    storage: ./pear/app-storage/by-dkey/50f2c1326de970da319534164017f23101c6badd5497a99045f8d9ef13978995

- pear://38cna455dbguiatg46z98cs7b6p4t4sh6hskozuhmipmpkxmmeuy
    storage: ./pear/app-storage/by-dkey/be6ff2fc20eb691af1ff7b90d5848ee1e22d2fe4fab031900e1014e224f659ab
```

For more information about the `pear data apps` command, see the [cli docs](./cli.md#pear-data-apps-flags-link).

## How Do I Uninstall a Pear Application?

Uninstalling Pear Applications is currently not supported. You can reset the storage for an application via the `pear reset <link>` command. This is a **destructive** command that will permanently delete the storage for the application loosing all data it contains. Use with caution.

For more information about the `pear reset` command, see the [cli docs](./cli.md#pear-reset-flags-less-than-link-greater-than).

## Where is the Pear Application stored?

The Pear framework, applications and their storage are all within the `pear` directory. The directory's path depends on the operating system:

| OS      | Pear Path                            |
| ------- | ------------------------------------ |
| MacOs   | `~/Library/Application Support/pear` |
| Linux   | `~/.config/pear`                     |
| Windows | `%userprofile%\AppData\Roaming\pear` |

This path can be accessed in a Pear application via [`Pear.config.pearDir`](./api.md#pear.config.peardir-less-than-string-greater-than).

Within the `pear` directory the Pear framework itself is stored where the `current` symlink points, Pear applications are stored in the `corestores` directory, and Pear application storage (aka [`Pear.config.storage`](./api.md#pear.config.storage-less-than-string-greater-than) for applications) are stored in `app-storage`.

Note that Pear applications and the Pear platform are stored in a [`corestore`](../../helpers/corestore.md) as [`hyperdrive`](../../building-blocks/hyperdrive.md)s so are not easily inspectable via a file explorer. To see the files distributed with an application use [`pear dump`](./cli.md#pear-dump-flags-less-than-link-greater-than-less-than-dir-greater-than) to dump its contents as files.

## Can Pear use with X language?

Pear applications currently can only be written in JavaScript, but other languages and libraries can be integrated by adding bindings as a native addon. See the [`bare-addon`](https://github.com/holepunchto/bare-addon) for a template to get started creating a native addon for Bare runtime.

For languages like TypeScript that compile to JavaScript, it is recommended to compile into JavaScript and then load it as the Javascript entrypoint either as the `main` property for a terminal application or as a `<script>` in the HTML entrypoint for a desktop application. For more information about configuring the entrypoint for Pear Application see [here](./configuration.md#the-package.json-file).

## How Do I Write an Application Once So It Can Be Run on Desktop, Mobile, etc?

The recommendation is to write Pear applications with all the business logic and peer-to-peer (P2P) code in what is called the "Pear-end". This is a separate worker/worklet thread that communicates to the user interface (UI) via an inter-process communication (IPC) stream. By abstracting the UI from the Pear-end, the Pear-end can be reused across all versions of the application with only the UI code changing.

At the moment, the `Pear` Application Programming Interface (API) is not supported in mobile applications. This will change as Pear v2 comes out which uses the separation of Pear-end and UI as the default.

## How is my Application Distributed? Do I have to keep the `seed` command running?

Pear applications are distributed via the swarm so that any peer with the application will reseed it to other peers when they are running the application. To speed up and facilitate replication, it is recommended to run the `pear seed <link>` command to ensure a peer is online and seeding the application.

## Why Is NPM Used For Dependencies?

NPM is a great package manager, many JavaScript developers are already familiar with it and all Holepunch's packages are published on NPM. Dependencies installed in your app should be staged with the Application and then are replicated via the swarm. It is recommended to do a dry run when staging to review the changes to the application. This will include all the changes to the dependencies and so can be used to audit them looking for unexpected updates.

After you install the `pear` via NPM and complete the setup, NPM and Node.js are no longer required to run Pear terminal applications. The `pear` package on NPM is only used to bootstrap the Pear platform. After the setup the `pear` command is using Bare to run the Pear application.

## How Do I Distribute a Binary Version of My Application?

You can make a binary version of a Pear applications using the [`pear-appling`](https://github.com/holepunchto/pear-appling/) template repository. This repository can be configure in `CMakeLists.txt`, providing the metadata for your application, and compiled for MacOS, Linux and Windows. The compiled output is a small binary used to bootstrap the Pear platform and the application replicating the most recent version of them. This way you rarely, if ever, need to recompile your binary. Any future user can download it and will be able to run the most recent version of your application after replicating.

## Can Peers Know My IP Address When Using `hyperswarm` or Swarming a Pear Application?

Your IP is exchanged with peers so that they can connect to you. If you want to protect your IP, it is recommended to use a VPN.
