import { around } from 'meld';
import { uniqueId, find } from 'underscore';
import Events from 'plug/core/Events';
import ChatView from 'plug/views/rooms/chat/ChatView';
import util from 'plug/util/util';
import emoji from 'plug/util/emoji';
import settings from 'plug/store/settings';
import Plugin from '../Plugin';
import style from './ChatTypePlugin.css';

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
  style,

  enable() {
    // chatView.onReceived will still be the old method after adding advice
    // so the event listener should also be swapped out
    this.replaceEventHandler(() => {
      this.chatTypeAdvice = around(ChatView.prototype, 'onReceived', this.onReceived);
    });
  },
  disable() {
    // remove custom chat type advice, and restore
    // the original event listener
    this.replaceEventHandler(() => {
      this.chatTypeAdvice.remove();
    });
  },

  // bound to the ChatView instance
  onReceived(joinpoint) {
    const message = joinpoint.args[0];
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
      message.cid = uniqueId('extp-');
    }
    // insert the chat message element
    joinpoint.proceed();

    const el = this.$chatMessages.children().last();
    if (message.classes) {
      el.addClass(message.classes);
    }
    if (message.badge) {
      if (/^:(.*?):$/.test(message.badge)) {
        // emoji badge
        const badgeBox = el.find('.badge-box');
        const emojiName = message.badge.slice(1, -1);
        if (emoji.map.colons[emojiName]) {
          badgeBox.find('i').remove();
          badgeBox
            .append(emoji.replace_colons(message.badge))
            // compatibility class
            .find('.emoji-outer').addClass('extplug-badji');
        }
      } else if (/^icon-(.*?)$/.test(message.badge)) {
        // icon badge
        const badgeBox = el.find('.badge-box');
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
    const chatView = this.ext.appView.room.chat;
    let handler;
    if (chatView) {
      handler = find(
        Events._events['chat:receive'], // eslint-disable-line no-underscore-dangle
        e => e.callback === chatView.onReceived
      );
    }
    fn();
    if (chatView) {
      if (!handler) {
        throw new Error('Could not replace chat handler');
      }
      handler.callback = chatView.onReceived;
    }
  },
});

export default ChatTypePlugin;
