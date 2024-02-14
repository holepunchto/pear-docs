# Debugging A Pear Terminal Application

It is easy to debug Pear Desktop Applications because it comes included with devtools. That is not the case with a Terminal Application so some steps are needed.

Use [Pear Inspect](https://github.com/holepunchto/pear-inspect) together with Pear Desktop and use any DevTools-supporting

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
  const inpector = await new Inspector()
  const key = await inpector.enable()
  console.log(`Debug with pear://runtime/devtools/${key.toString('hex')}`)
}
```

## Step 3. Run In Dev Mode

As the code specifies, `pear-inspect` is only running when in dev mode, so start the app:

```
pear dev .
```

The application will output something similar to:

```
Debug with pear://runtime/devtools/a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
```

## Step 4. Add to Pear Desktop

In Pear Desktop go to `Developer Tooling` and paste in the key.

Note that the key can also be sent to someone else and they can debug the app remotely.

## Step 5. Open in Chrome

Click on `Open in Chrome` or copy the link into a tool that support DevTools.
