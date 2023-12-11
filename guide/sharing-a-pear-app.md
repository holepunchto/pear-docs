# Sharing a Pear Application

Before releasing a Pear app to the public, it's possible to share it with others.

With Pear there are one single "release" (or "production") version of an app, and then many other named versions. Think of it, the same way that `git` use branches. Code is put into channels. This way others can test it, and when everything is ready, that branch is pulled into the release channel.

To share apps, stage them using `pear stage some-name`. This builds a new version of the app and puts them into the `some-name` channel.


## Step 1. Stage

Before sharing the app, first stage it into a channel called `example` (the name can be anything)

```
$ pear stage example
```

## Step 2. Seed

After the app has been staged into the `example` channel, it now needs to be seeded. This is a way to signal that the app is now shared, so others can download and run it.

```$ pear seed example

🍐 Seeding: chat [ example ]
   ctrl^c to stop & exit

-o-:-
    pear:nykmkrpwgadcd8m9x5khhh43j9izj123eguzqg3ygta7yn1s379o
...
^_^ announced
```

For now, keep this terminal open. As long as this process is running, your computer will help seed the application.

## Step 3. Launch

Because the app is now being seeded, it' possible for others with the key (`pear:nykm...`) to launch it.

In another terminal (or on another computer), run:

```
$ pear launch pear:nykmkrpwgadcd8m9x5khhh43j9izj123eguzqg3ygta7yn1s379o
```

![Launching the app with pear launch](../assets/chat-app-6.png)

This will download and open the app.

Note: Anyone running the app also help to seed it. So if the app had a lot of users, the original seeder could close down the process.

## Next

The app is shared and others can now run it on their machines. To learn how a more production-ready setup would look like read [releasing a Pear App](./releasing-a-pear-app.md).
