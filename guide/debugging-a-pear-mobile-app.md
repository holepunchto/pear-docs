# Debugging A Pear Terminal Application

It is easy to debug Pear Desktop Applications because it comes included with devtools. That is not the case with a Mobile Application so some steps are needed.

Use [Pear Inspect](https://github.com/holepunchto/pear-inspect) together with Pear Desktop and use any DevTools-supporting application like Chrome to debug it.

## Step 1. Install pear-inspect

First install `pear-inspect`:

```
npm install pear-inspect
```

## Step 2. Add Code

This code should run as the first thing in the application:

``` js
if (isInDevMode) { // Change this to a way so you can see if you are in a dev mode
  const { Inspector } = await import('pear-inspect')
  const inpector = await new Inspector()
  const key = await inpector.enable()
  console.log(`Debug with pear://runtime/devtools/${key.toString('hex')}`)
}
```

## Step 3. Run

Start the application. It will output:

```
Debug with pear://runtime/devtools/a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
```

## Step 4. Add to Pear Desktop

In Pear Desktop go to `Developer Tooling` and paste in the key.

Note that the key can also be sent to someone else and they can debug the app remotely.

## Step 5. Open in Chrome

Click on `Open in Chrome` or copy the link into a tool that support DevTools.
