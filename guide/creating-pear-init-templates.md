# Creating Pear Init Templates


This document describes how to create a `pear init` template configuration using a JSON structure. The template defines parameters that can be used to customize the generation or configuration of a project or application.

## Structure

The template is defined as a JSON object with a single key `"params"`, which contains an array of parameter objects.

```json
{
  "params": [
    // Array of parameter objects
  ]
}
```

## Parameter Object

Each parameter object in the `params` array defines a specific input parameter. Here are the possible fields for a parameter object:

### Required Fields

- `name` (string): The identifier for the parameter. This should be unique within the template.
- `prompt` (string): The text prompt that will be displayed to the user when asking for input for this parameter.

### Optional Fields

- `default` (any): The default value for the parameter if no input is provided.
- `validation` (string): A JavaScript function as a string that validates the input. It should return `true` for valid input and `false` for invalid input.
- `msg` (string): An error message to display if the validation fails.

## Field Descriptions

### name

The `name` field is a string that serves as the identifier for the parameter. It should be unique within the template and will typically be used to reference the parameter value in the code that consumes this configuration.

Example:
```json
"name": "main"
```

### prompt

The `prompt` field is a string that will be presented to the user when they are asked to provide a value for this parameter. It should clearly describe what input is expected.

Example:
```json
"prompt": "Enter the main HTML file name"
```

### default

The `default` field provides a fallback value for the parameter if the user doesn't provide input. This field is optional.

Example:
```json
"default": "index.html"
```

### validation

The `validation` field contains a JavaScript function as a string. This function should take a single argument (the input value) and return a boolean indicating whether the input is valid (`true`) or invalid (`false`).

Example:
```json
"validation": "(value) => value.endsWith('.html')"
```

### msg

The `msg` field provides an error message to display if the validation fails. This helps guide the user to provide correct input.

Example:
```json
"msg": "must have an .html file extension"
```

## Example

Here's an example of a complete parameter object:

```json
{
  "name": "main",
  "default": "index.html",
  "prompt": "Enter the main HTML file name",
  "validation": "(value) => value.endsWith('.html')",
  "msg": "must have an .html file extension"
}
```

This parameter:
- Has the name "main"
- Defaults to "index.html" if no input is provided
- Prompts the user to enter the main HTML file name
- Validates that the input ends with ".html"
- Displays an error message if the validation fails

## Best Practices

1. Use clear and concise names for parameters.
2. Provide helpful prompts that guide the user to input the correct information.
3. Use validation functions to ensure the input meets your requirements.
4. Provide informative error messages to help users correct their input.
5. Use default values where appropriate to streamline the input process.