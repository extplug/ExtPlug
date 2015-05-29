# ExtPlug

[![Join the chat at https://gitter.im/ExtPlug/ExtPlug](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/ExtPlug/ExtPlug?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

ExtPlug is a flexible, modular extension framework for plug.dj.

### Using

Bookmarklet style:

```javascript
javascript:(function(){ $.getScript('https://extplug.github.io/ExtPlug/extplug.js') }());
```

### Building

ExtPlug uses Bower and NPM to manage dependencies, and Gulp for building.

```shell
git clone https://github.com/ExtPlug/ExtPlug
cd ExtPlug
bower install
npm install
gulp build # outputs to build/build.full.js
```

### Bundled Plugins

The default ExtPlug build comes bundled with a bunch of commonly-used plugins:

* Autowoot: Woots every song automatically
* Chat Notifications: Shows notifications in the Chat area when users join the
  room, leave the room, grab/woot/meh a song, and when a new song starts.
* Full-Size Video: Expands the video area to the entire audience space. It's a
  bit bigger than plug.dj's own Video Only mode.
* Hide Badges: Hides badges in chat.
* Meh Icons: Show a meh icon in the user list, in addition to plug.dj's own woot
  and grab icons.
* Room Styles: Applies room styles, using either plug³ or RCS formats. Room
  owners don't need to change anything to support ExtPlug.
