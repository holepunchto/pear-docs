# Debugging A Pear Terminal Application

Debugging Pear Terminal Applications is different than debugging Desktop Applications because they do not come with a UI. Instead a few steps are needed.

Use [Pear Inspect](https://github.com/holepunchto/pear-inspect) together with the Pear Runtime Desktop and use any tool that supports DevTools like Chrome.

## Step 1. Install pear-inspect

First install `pear-inspect`:

```
npm install pear-inspect
```

## Step 2. Add Code

This code should run as the first thing in the application:

``` js
if (Pear.config.dev) {
  const { Inspector } = await import('pear-inspect')
  const inspector = await new Inspector()
  const key = await inspector.enable()
  console.log(`Debug with pear://runtime/devtools/${key.toString('hex')}`)
}
```

## Step 3. Run In Dev Mode

As the code specifies, `pear-inspect` is only running when in dev mode, so start the app:

```
pear run --dev .
```

The application will output something similar to:

```
Debug with pear://runtime/devtools/a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
```

## Step 4. Add to Pear Runtime Desktop

Open the Pear Runtime Desktop app by running `pear run pear://runtime`. Then go to `Developer Tooling` and paste in the key.

Note that the key can also be sent to someone else and they can debug the app remotely.

## Step 5. Open in Chrome

Click on `Open in Chrome` or copy the link into a tool that support DevTools.
