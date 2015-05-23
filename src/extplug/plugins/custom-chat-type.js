define(function (require, exports, module) {

  const { around } = require('meld');
  const Events = require('plug/core/Events');
  const ChatView = require('plug/views/rooms/chat/ChatView');
  const util = require('plug/util/util');
  const settings = require('plug/store/settings');
  const Plugin = require('../Plugin');

  /**
   * The ChatType Plugin adds a "custom" chat type. Any chat messages
   * passed through the ChatView "onReceived" handler will be affected,
   * so in particular all "chat:receive" events are handled properly.
   *
   * A chat message with "custom" in its type property can take a few
   * additional options:
   *
   *  * the "badge" property can contain an emoji name (eg ":eyes:") or
   *    an icon class (eg "icon-plugdj") as well as the standard badge
   *    names.
   *  * the "color" property takes a CSS colour, which will be used for
   *    the message text.
   *  * the "timestamp" property always defaults to the current time if
   *    it is left empty.
   *
   * This is especially useful for showing notifications in chat.
   * The "type" property can be a list of CSS class names, if it contains
   * "custom", (eg `{ type: "custom inline my-notification" }`) so you
   * can use those classes to style your message as well. Note that you
   * cannot add additional classes for the other message types.
   */
  const ChatTypePlugin = Plugin.extend({
    enable() {
      // chatView.onReceived will still be the old method after adding advice
      // so the event listener should also be swapped out
      let chatView = this.ext.appView.room.chat;
      if (chatView) {
        Events.off('chat:receive', chatView.onReceived);
      }
      this._chatTypeAdvice = around(ChatView.prototype, 'onReceived', this.onReceived);
      if (chatView) {
        Events.on('chat:receive', chatView.onReceived, chatView);
      }
    },
    disable() {
      // remove custom chat type advice, and restore
      // the original event listener
      let chatView = this.ext.appView.room.chat;
      if (chatView) {
        Events.off('chat:receive', chatView.onReceived);
      }
      this._chatTypeAdvice.remove();
      if (chatView) {
        Events.on('chat:receive', chatView.onReceived, chatView);
      }
    },

    // bound to the ChatView instance
    onReceived(joinpoint) {
      let message = joinpoint.args[0];
      if (message.type.split(' ').indexOf('custom') !== -1) {
        // plug.dj has some nice default styling on "update" messages
        message.type += ' update';
        if (!message.timestamp) {
          message.timestamp = util.getChatTimestamp(settings.settings.chatTimestamps === 24);
        }
        // insert the chat message element
        joinpoint.proceed();
        if (message.badge) {
          // emoji badge
          if (/^:(.*?):$/.test(message.badge)) {
            let badgeBox = this.$chatMessages.children().last().find('.badge-box');
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
            let badgeBox = this.$chatMessages.children().last().find('.badge-box');
            badgeBox.find('i')
              .removeClass()
              .addClass('icon').addClass(message.badge);
          }
        }
        if (message.color) {
          this.$chatMessages.children().last().find('.msg .text').css('color', message.color);
        }
      }
      else {
        joinpoint.proceed();
      }
    }
  });

  module.exports = ChatTypePlugin;

});
