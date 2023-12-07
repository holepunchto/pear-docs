# Releasing a Pear App

As covered in [Sharing a Pear App](./sharing-a-pear-app.md), Pear use release channels in a similar way that git use branches. When the app has been tested, and it's ready to release it, it's really simple.

## Step 1. Releasing

Assume that the app was staged into `example`, then releasing it is simply:

```
$ pear release example
```

This moves the example channel to the released version. The seeders who are already seeding that channel, will still be seeding.
