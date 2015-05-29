Creating Plugins
================

ExtPlug plugins are simply classes that inherit from Plugin. They are contained
in one or more require.js modules.

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

})
```