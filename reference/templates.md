# Templates

The `pear init` command can be used to generate a project from a template.

This document describes how to create a template for `pear init`.

See [pear-templates](https://github.com/holepunchto/pear-templates) for a collection of reference templates.

## Declaring Locals

A local is any text within double underscores eg `__author__`. This includes filenames, for example `__foo__.js` would be rendered per the value of `foo` as supplied via user prompts, eg if the user supplied `bar` as a response to the `foo` prompt then `__foo__.js` would render as `bar.js`.

## Describing Prompts

A Pear Template must have a `_template.json` file.

The `_template.json` file must contains an object with a `params` field which defines user prompts:

```json
{
  "params": [...]
}
```

Each param is an object describing the user prompt, possible param values:

* `name` - Required. `String`. Corresponds to a declared local.
* `prompt` - `String`. The prompt label to display to the user
* `default` - Value default
* `override` - `Array<String>`. An array representing path to a configuration option that, if set, overrides the value supplied by the user. Useful for re-rendering. Example: ["pear", "gui", "height"] would over a height prompt if the config value is already set.
* `shave` - `Array<n,n>`. A two-element array representing offsets to remove chars beyond the boundaries of the declared local. Useful for numbers which will, due to user input being strings, be interleaved as strings - using [-1, 1] for such cases shaves the quotes off of pre-validated numbers within strings.
* `validation` - `String`. A string holding a function of form `"(value) => Boolean"`. Evaluates prompt input, returns `true` if valid, `false` if not.
* `msg` - `String`. Validation failure message to display.

The `_template.json` file won't be rendered into the resulting project, all other files will.

## Developing Templates

In the `pear init <link>` command a `link` can be a directory.

```sh
pear init ./path/to/template some-output-dir
```

## Deploying Templates

To make it possible to initialize a template peer-to-peer from any machine, stage and seed it like any other Pear Project:

```sh
cd ./path/to/template
pear stage production
pear seed production
```

The `pear stage` command will output a `pear://<key>` link. Initialize the template from that link on any machine:

```sh
pear init pear://<key>
```


