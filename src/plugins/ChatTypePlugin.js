define(function (require, exports, module) {

  const { around } = require('meld');
  const { uniqueId, find } = require('underscore');
  const Events = require('plug/core/Events');
  const ChatView = require('plug/views/rooms/chat/ChatView');
  const util = require('plug/util/util');
  const emoji = require('plug/util/emoji');
  const settings = require('plug/store/settings');
  const Plugin = require('../Plugin');

  /**
   * The ChatType Plugin adds a bunch of useful options to chat message
   * objects. Any chat messages passed through the ChatView "onReceived"
   * handler will be affected, so in particular all "chat:receive" events
   * are handled properly.
   *
   *  * the "badge" property can contain an emoji name (eg ":eyes:") or
   *    an icon class (eg "icon-plugdj") as well as the standard badge
   *    names. Only 30*30px icons will be aligned properly.
   *  * the "color" property takes a CSS colour, which will be used for
   *    the message text.
   *  * the "timestamp" property always defaults to the current time if
   *    it is left empty.
   *  * the "classes" property can contain a string of CSS classes. This
   *    is preferable to adding multiple classes in the "type" property,
   *    because other code might want to _check_ the "type" property and
   *    won't expect to find more than one type.
   */
  const ChatTypePlugin = Plugin.extend({
    enable() {
      // chatView.onReceived will still be the old method after adding advice
      // so the event listener should also be swapped out
      this.replaceEventHandler(() => {
        this._chatTypeAdvice = around(ChatView.prototype, 'onReceived', this.onReceived);
      });
    },
    disable() {
      // remove custom chat type advice, and restore
      // the original event listener
      this.replaceEventHandler(() => {
        this._chatTypeAdvice.remove();
      });
    },

    // bound to the ChatView instance
    onReceived(joinpoint) {
      let message = joinpoint.args[0];
      if (message.type.split(' ').indexOf('custom') !== -1) {
        // plug.dj has some nice default styling on "update" messages
        message.type += ' update';
      }
      if (!message.timestamp) {
        message.timestamp = util.getChatTimestamp(settings.settings.chatTimestamps === 24);
      }
      // add cid if it doesn't exist, to prevent a `.cid-undefined` selector
      // from catching everything
      if (!message.cid) {
        message.cid = uniqueId('extp-')
      }
      // insert the chat message element
      joinpoint.proceed();

      let el = this.$chatMessages.children().last();
      if (message.classes) {
        el.addClass(message.classes);
      }
      if (message.badge) {
        // emoji badge
        if (/^:(.*?):$/.test(message.badge)) {
          let badgeBox = el.find('.badge-box');
          let emojiName = message.badge.slice(1, -1);
          if (emoji.map[emojiName]) {
            badgeBox.find('i').remove();
            badgeBox.append(
              $('<span />').addClass('emoji-glow extplug-badji').append(
                $('<span />').addClass('emoji emoji-' + emoji.map[emojiName])
              )
            );
          }
        }
        // icon badge
        else if (/^icon-(.*?)$/.test(message.badge)) {
          let badgeBox = el.find('.badge-box');
          badgeBox.find('i')
            .removeClass()
            .addClass('icon').addClass(message.badge);
        }
      }
      if (message.color) {
        el.find('.msg .text').css('color', message.color);
      }
    },

    // replace callback without affecting calling order
    replaceEventHandler(fn) {
      let chatView = this.ext.appView.room.chat;
      let handler;
      if (chatView) {
        console.log(Events._events['chat:receive'].map(x=>x.callback), chatView.onReceived)
        handler = find(Events._events['chat:receive'], e => e.callback === chatView.onReceived)
      }
      fn();
      if (chatView) {
        if (!handler) {
          throw new Error('Could not replace chat handler');
        }
        handler.callback = chatView.onReceived;
      }
    }
  });

  module.exports = ChatTypePlugin;

});
