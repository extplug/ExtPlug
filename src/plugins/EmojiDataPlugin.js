define(function (require, exports, module) {

  const Plugin = require('../Plugin');
  const Events = require('plug/core/Events');
  const emoji = require('plug/util/emoji');
  const { around } = require('meld');

  const EmojiDataPlugin = Plugin.extend({
    name: 'Emoji Data',
    description: 'Adds CSS classes and HTML5 data attributes to emoji images.',

    enable() {
      this.advice = around(emoji, 'replacement', joinpoint => {
        let name = joinpoint.args[2];
        if (!name) {
          // attempt to find the name in the emoji-data map
          let id = joinpoint.args[0];
          let data = emoji.data[id];
          if (data) name = data[3][0];
        }
        let html = joinpoint.proceed();
        if (name) {
          return html.replace(
            ' class="emoji-inner',
            ` data-emoji-name="${name}" class="emoji-inner extplug-emoji-${name}`
          );
        }
        return html;
      });

      this.listenTo(Events, 'chat:afterreceive', (msg, el) => {
        el.find('.gemoji-plug').each(function () {
          let inner = $(this);
          let emojiName = inner.attr('class').match(/gemoji-plug-(\S+)/);
          if (emojiName) {
            inner.attr('data-emoji-name', emojiName[1])
                 .addClass(`extplug-emoji-${name}`);
          }
        });
      });
    },

    disable() {
      this.advice.remove();
    }
  });

  module.exports = EmojiDataPlugin;

});
