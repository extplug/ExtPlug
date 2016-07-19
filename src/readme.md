# ExtPlug Source Code

Welcome to the ExtPlug source files!

This directory contains most of the source code that drives ExtPlug. The
directory structure is similar to plug.dj's own source directory tree,
separating the various types of classes into their own subdirectories.

## In This Directory

[Plugin.js](./Plugin.js) contains the Plugin base class.

[ExtPlug.js](./ExtPlug.js) is the main plugin in ExtPlug. Its task is managing
plugins and version upgrades. That's right--the ExtPlug class itself is also
just a plugin! You can access the ExtPlug instance through the global variable
`extp` if you need to do plugin management in your own plugins.

The main ExtPlug class is instantiated by [main.js](./main.js), after running
the [plug-modules](https://github.com/ExtPlug/plug-modules) library to
deobfuscate plug.dj's internal module names.

All of that is then executed by [loader.js](./loader.js.template) when plug.dj
is ready.

The [plugins/](./plugins/) directory contains core plugins that add more
functionality to plug.dj, such as event types, the core ExtPlug chat commands,
and the plugin management views.
