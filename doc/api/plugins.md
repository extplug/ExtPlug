Plugin URLs
===========

Plugins are installed from URLs. Sometimes, though, ExtPlug needs a little more
information than just the URL.

A plugin URL looks roughly like:

```
https://my-site.com/path/to/plugin.js;metadata1;metadata2
```

Currently, ExtPlug only supports one type of metadata:

 * the plugin entry point. This is only necessary if you built your plugin using
   the Yeoman Generator or using the require.js optimizer (see
   [Multi-Module Plugins](#multimodule-plugins)). This looks like:

   ```
   https://my-site.com/path/to/autowoot.js;my-name/autowoot/main
   ```

   This will tell ExtPlug to load the `my-name/autowoot/main` module from
   `https://my-site.com/path/to/autowoot.js`.

Creating Plugins
================

ExtPlug plugins are simply classes that inherit from Plugin.  You define
your functionality in the `enable` method of your plugin, and reverse
everything you've done in the `disable` method of your plugin.

The Plugin skeleton looks like:

```javascript
define(function (require, exports, module) {

  const Plugin = require('extplug/Plugin')

  const MyPlugin = Plugin.extend({
    name: 'My Plugin',
    description: 'A thing that does something',

    enable() {
      // do something
    },

    disable() {
      // undo something
    }

  })

  module.exports = MyPlugin

})
```

Once you've implemented your plugin, you can host it somewhere (Github
is a good option!) and install your plugin by going to the ExtPlug
settings menu, pressing "Install Plugin" and entering the URL of your
plugin.

## Libraries loaded by plug.dj and ExtPlug

Both plug.dj and ExtPlug load a few libraries that are also very useful
for plugins.

plug.dj loads:

 * jQuery (`require('jquery')`) for raw DOM manipulation
 * Underscore (`require('underscore')`) for lots of utility functions
 * Backbone (`require('backbone')`) for sort-of MVC

ExtPlug loads:

 * meld (`require('meld')`) for "Aspect-Oriented Programming"

   The `meld` library is used for overriding internal plug.dj functions. You
   should use this library too, because it allows different overrides to be
   applied and removed in any order. What that means, is that you'll never have
   to worry about other plugins overwriting your changes. See the
   [Overriding Behaviour](./overriding-behavior.md) document for more.

## Multi-Module Plugins

If your plugin is simple, the above "single module in a single file"
approach described above works well. However, if your module is more complex,
you might wish to split up your code in several different modules. The easiest
way to do so is by building your plugin on the [Yeoman ExtPlugin generator](https://github.com/ExtPlug/generator-extplugin).
Otherwise, you can create your own built file using the [require.js optimizer](http://requirejs.org/docs/optimization.html).

When building your plugin in any of those ways, you'll end up with a built file
containing several different _named_ require.js modules. Anonymous modules can
be grabbed straight from a URL, but for named modules it's a bit more complex.
ExtPlug looks at your [Plugin URL](#plugin-urls) and grabs the main module name
from there.

TODO
