# ExtPlug

[![Join the chat at https://gitter.im/PlugLynn/ExtPlug](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/PlugLynn/ExtPlug?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

ExtPlug is a flexible, modular extension for plug.dj.

## Building

ExtPlug uses Bower and NPM to manage dependencies, and Gulp for building.

```shell
git clone https://github.com/PlugLynn/ExtPlug
cd ExtPlug
bower install
npm install
gulp build # outputs to build/build.full.js
```

## Modules

ExtPlug comes bundled with a bunch of commonly-used modules:

* Autowoot: Woots every song automatically
* ChatNotifications: Shows notifications in the Chat area when users join the room, leave the room, or grab a song, and when a new song starts.
* FullSizeVideo: Expands the video area to the entire audience space. (So it'll replace the avatars and room background.)
* MehIcon: Show a meh icon in the user list, in addition to plug.dj's own woot and grab icons.
* RoomStyles: Applies Plug³ room styles, following the same format. Room owners don't need to change anything to support ExtPlug.

### Creating your own

For inspiration, check out one of the bundled modules. Autowoot is very simple, so that might be a good place to start. ChatNotifications is also very simple, and includes a nice example for using Module-specific settings.

Your module should have `enable` and `disable` methods. Ideally, your `disable` method cleans up entirely, leaving no trace of your module on the page.

A module definition looks roughly like this:

```javascript
// plug.dj has require.js on the page, so you can just define()
// your modules AMD-style. make sure to use unique module names,
// though, to prevent clashing with other people's modules.
define('my-name/my-module/main', function (require, exports, module) {

  // all plug-modules remapped names are defined on the global require().
  // see https://github.com/PlugLynn/plug-modules
  var Events = require('plug/core/Events');

  var Module = require('extplug/Module');

  // this is just a require.js module factory, so we can do anything...
  // defining helpers, for example!
  function pad(num) {
    if (num < 10) return '0' + num;
    else return num;
  }

  // your module definition should extend from the extplug/Module class.
  // override the enable() and disable() methods with your module
  // functionality. try to clean up perfectly afterwards in the disable()
  // module, or users might get confused when they cannot disable or
  // re-enable your module.
  // you should also define some metadata (name, description) like below.
  module.exports = Module.extend({
    name: 'Example Module',
    description: 'A module descrption that will show in a tooltip ' +
                 'in the module list.',

    init: function (id, ext) {
      // _super does some useful things here, don't forget!
      this._super(id, ext);
      // do class initialization here
      // binding methods, maybe!
      this.showTime = _.bind(this.showTime, this);
    },

    enable: function () {
      this._super();
      // kick off your module here.
      // attach events, start intervals, manipulate DOM elements…
      this._interval = setInterval(this.showTime, 60 * 1000);
    },
    disable: function () {
      this._super();
      // basically just revert everything you did in enable!
      clearInterval(this._interval);
    },

    showTime: function () {
      var now = new Date(),
        time = 'The time is ' + pad(now.getHours()) + ':' + pad(now.getMinutes());
      // icon-history-white looks like a clock.
      Events.trigger('notify', 'icon-history-white', time);
    }
  });

});

// finally, push your main module path to the global extp array.
// if ExtPlug is already loaded, this will immediately load your
// module. if ExtPlug is not yet loaded, this will create a global
// array with your module name, and ExtPlug will load it once it
// is loaded, itself.
(extp = window.extp || []).push('my-name/my-module/main');
```