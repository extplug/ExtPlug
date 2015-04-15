# ExtPlug

[![Join the chat at https://gitter.im/PlugLynn/ExtPlug](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/PlugLynn/ExtPlug?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

ExtPlug is a flexible, modular extension for plug.dj.

## Building

```shell
git clone https://github.com/PlugLynn/ExtPlug
cd ExtPlug
npm install
npm run-script build
```

## Modules

ExtPlug comes bundled with a bunch of commonly-used modules:

* Autowoot: Woots every song automatically
* ChatNotifications: Shows notifications in the Chat area when users join the room, leave the room, or grab a song, and when a new song starts.
* FullSizeVideo: Expands the video area to the entire audience space. (So it'll replace the avatars and room background.)
* MehIcon: Show a meh icon in the user list, in addition to plug.dj's own woot and grab icons.
* RoomStyles: Applies Plug³ room styles, following the same format. Room owners don't need to change anything to support ExtPlug.

### Creating your own

Documentation is a bit sparse, as I haven't quite figured out some stuff yet. So don't do too many complex things just yet, this system might change significantly!

For inspiration, check out one of the bundled modules. Autowoot is very simple, so that might be a good place to start. ChatNotifications is also very simple, and includes a nice example for using Module-specific settings.

Your module should have `enable` and `disable` methods. Ideally, your `disable` method cleans up entirely, leaving no trace of your module on the page.

A module definition looks roughly like this:

```javascript
// This first line ensures that you will only call `ext.define` after ExtPlug has fully loaded
(extp = window.extp || []).push(function (ext) {

  // ext.define takes care of registering your module with ExtPlug, so you can just
  // return a Module class from the callback.
  ext.define('ExampleModule', function (require, exports, module) {

    var Events = require('plug/core/Events'),
      Module = require('extplug/Module');

    // this is just a require.js module factory, so we can do anything...
    // defining helpers, for example!
    function pad(num) {
      if (num < 10) return '0' + num;
      else return num;
    }

    module.exports = Module.extend({
      name: 'Example Module',

      init: function (id, ext) {
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

});
```