# ExtPlug

![MIT Licensed](https://img.shields.io/github/license/extplug/extplug.svg?style=flat-square)
![Version](https://img.shields.io/github/tag/extplug/extplug.svg?style=flat-square)
[![David dependencies](https://img.shields.io/david/extplug/extplug.svg?style=flat-square)](https://david-dm.org/extplug/extplug)
[![David devDependencies](https://img.shields.io/david/dev/extplug/extplug.svg?style=flat-square)](https://david-dm.org/extplug/extplug#info=devDependencies)
[![Gitter](https://img.shields.io/badge/gitter-join_chat-ff69b7.svg?style=flat-square)](https://gitter.im/ExtPlug/ExtPlug)

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
