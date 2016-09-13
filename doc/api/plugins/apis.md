# Plugin APIs

 * [Events](#events)
 * [Plugin Settings](#plugin-settings)
 * [CSS](#css)
 * [Chat Commands](#chat-commands)

## Events

The Events API can be used to add events to Backbone Events objects. It's the
preferred way to do so, because events added through the Events API will
automatically be cleaned up when your plugin is disabled, so you don't have to
worry about it in your `disable()` method.

The Events API contains three methods:

  * `this.listenTo` - The [Backbone.Events.listenTo] method, used for adding
    event listeners.

    ```js
    import Events from 'plug/core/Events';

    const EveryoneIsSubscriber = Plugin.extend({
      enable() {
        // this handler will be automatically removed when the plugin is
        // disabled, so no custom disable() method is needed.
        this.listenTo(Events, 'chat:beforereceive', message => {
          message.sub = 1;
        });
        // Event listeners added with `.listenTo` are also bound to the plugin
        // instance by default, so you can use `this` inside them safely.
        this.listenTo(Events, 'chat:command', this.handleCommand);
      },

      handleCommand(text) {
        if (text === '/disablesub') {
          this.disable();
        }
      }
    });
    ```

  * `this.listenToOnce` - The [Backbone.Events.listenToOnce] method, used for
    adding event listeners that should only fire once.

  * `this.stopListening` - The [Backbone.Events.stopListening] method removes all
    event listeners that were added by your plugin. This method is called
    automatically when your plugin is disabled.

## Plugin Settings

The Plugin Settings API manages settings persistence for you and helps you
integrate your plugin settings with ExtPlug's configuration views.

### Settings Model

The core settings API provides a settings model that you can use to store plugin
configuration. It will automatically be saved and loaded when your plugin is
disabled or enabled again. The settings model can be accessed throughout your
plugin using `this.settings`:

```js
const AlertPlugin = Plugin.extend({
  // ...
  enable() {
    if (this.settings.get('showAlertOnEnable')) {
      alert('Enabled!');
    }
  }
  // ...
})
```

You can specify defaults for these settings by including a `settings` property
in your Plugin definition:

```js
settings: {
  showAlertOnEnable: { default: true },
  eatBreakfast: { default: true }
}
```

### Settings View

The Plugin Settings API can also generate a settings view for you.

TODO

## CSS

Using the CSS API, you can add styles to the page without having to remember to
remove it when your plugin is disabled.

The CSS API consists of two methods:

  * `this.createStyle(stylesObject)` to create and add a Style object. The
    `stylesObject` should be a plain Javascript object mapping CSS selectors to
    rulesets. (See the [sistyl] documentation.)

    ```js
    const RainbowPlugin = Plugin.extend({
      name: 'RAAAAINBOOOOOWS',
      description: 'Moves text colours along the rainbow scale.',
      enable() {
        let colors = [ 'red', 'orange', 'yellow', 'green', 'blue', 'purple' ]
        let current = 0
        let style = this.createStyle({
          '*': { 'color': colors[current] }
        })
        this.interval = setInterval(() => {
          current = (current + 1) % 6
          // you can change styles at any point, and the page will be updated
          style.set('*', { 'color': colors[current] })
        }, 1000)
      },
      disable() {
        clearInterval(this.interval)
      }
    })
    ```

  * `this.removeStyles()` to remove all your added stylesheets. This is called
    automatically when your plugin is disabled.

If you don't need any dynamic creation/live-update fanciness, you can also just
define a `style: {}` property on your plugin, and a Style object will be created
for you automatically:

```js
const RedTextPlugin = Plugin.extend({
  style: {
    '*': { 'color': 'red !important' }
  }
})
```

## Chat Commands

TODO

[Backbone.Events.listenTo]: http://backbonejs.org/#Events-listenTo
[Backbone.Events.listenToOnce]: http://backbonejs.org/#Events-listenToOnce
[Backbone.Events.stopListening]: http://backbonejs.org/#Events-stopListening
[sistyl]: https://github.com/goto-bus-stop/sistyl#readme
