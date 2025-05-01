# Troubleshooting

The article aims to help troubleshooting confusing scenarios while developing Bare applications.

## Missing builtin Modules when Running with Bare

Bare is minimal by design, so does not include all of the modules provided with Nodejs. Instead modules such as `process` can be imported as a Bare specific module, for example `bare-process`. For a list of Nodejs builtins and their Bare replacements, check out `bare-node`'s ["Modules" table](https://github.com/holepunchto/bare-node?tab=readme-ov-file#modules)

### Writing a module with Support for Bare & Nodejs

If writing a library that can be run in both the Bare and Nodejs runtimes, import maps should be used to support both the Bare version and the Nodejs version of builtin modules. Import maps only apply to the `package.json`'s module so does not modify dependencies of the module.

See [`bare-node`'s "Import maps"](https://github.com/holepunchto/bare-node?tab=readme-ov-file#import-maps) for more details.

### Running 3rd Party Modules Written for Nodejs

To update dependencies to support only the Bare version of builtins, an alias can be used to set a builtin to a wrapper module. For example to use `bare-net` where ever `net` is used in dependencies, install it as an alias:

```
npm i bare-net net@npm:bare-node-net
```

For compatibility and to support builtin globals, such as `process`, the corresponding `bare-*` module will include a `/global.js` submodule that sets the global variable to `global`. This is useful when importing modules that assume the global variable exists. It is not recommended to use global variables when writing new code as it is less flexible and a harder to upgrade piecemeal.

Usage of a globals submodule looks like:

```
require('bare-process/global')
console.log('platform', process.platform) // now prints
```
