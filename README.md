# ExtPlug

[![Join the chat at https://gitter.im/ExtPlug/ExtPlug](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/ExtPlug/ExtPlug?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

ExtPlug is a flexible, modular extension framework for plug.dj.

This repository contains mostly technical information. If you just want to _use_
ExtPlug, visit [the ExtPlug website](https://extplug.github.io) instead. If
you're a developer, read on!

## Building

ExtPlug uses NPM to manage dependencies, and Gulp for building.

```shell
git clone https://github.com/ExtPlug/ExtPlug
cd ExtPlug
npm install
gulp
```

The default `gulp` task outputs:

 * A built & concatenated file in `build/extplug.js`
 * A Greasemonkey userscript in `build/extplug.user.js`
 * An unpacked Chrome extension in `build/chrome/`

## License

[MIT](./LICENSE)
