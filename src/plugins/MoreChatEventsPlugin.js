import $ from 'jquery';
import { find } from 'underscore';
import { before, after, joinpoint } from 'meld';
import chatFacade from 'plug/facades/chatFacade';
import currentUser from 'plug/models/currentUser';
import currentRoom from 'plug/models/currentRoom';
import ChatView from 'plug/views/rooms/chat/ChatView';
import Events from 'plug/core/Events';
import Plugin from '../Plugin';

// Adds a bunch of new chat events.
// "chat:incoming" is fired as soon as a new message is received from the socket.
//   It gets three arguments: The Message object, a boolean `isSystemMessage`, and
//   a boolean `isMine` (true if the current user sent the message.)
function fireIncoming(message, isSystemMessage, isMine) {
  Events.trigger('chat:incoming', message, isSystemMessage, isMine);
}
// "chat:beforereceive" is fired after some initial processing, but before the message
// is passed to the plug.dj view layer. This is where you probably want to do your
// modifications to the Message object.
function fireBeforeReceive(message, isSystemMessage) {
  Events.trigger('chat:beforereceive', message, isSystemMessage);
}
// "chat:afterreceive" is fired after the message has been rendered. It gets two arguments:
//   The Message object, and a jQuery object containing the message DOM element.
function fireAfterReceive(message) {
  const element = $('#chat-messages .cm:last-child');
  Events.trigger('chat:afterreceive', message, element);
}
// "chat:send" is fired when the user sends a message. It takes a single argument: A string
//   with the text content of the message.
function fireSend(message) {
  // ensure that the user is allowed to send a message.
  // this does _not_ check for mutes. Plug will pretend that your message
  // went through if you're muted--so we do the same.
  if (currentUser.get('guest') || !currentRoom.get('joined') ||
      currentUser.get('level') < currentRoom.get('minChatLevel') ||
      message[0] === '/') {
    return;
  }
  Events.trigger('chat:send', message);
}

const MoreChatEvents = Plugin.extend({
  name: 'More Chat Events',
  description: 'Adds more chat events for plugins to hook into.',

  enable() {
    Events.on('chat:receive', fireBeforeReceive);
    // ensure fireBeforeReceive is the first event handler to be called
    const receiveHandlers =
      Events._events['chat:receive']; // eslint-disable-line no-underscore-dangle
    receiveHandlers.unshift(receiveHandlers.pop());
    this.incomingAdvice = before(chatFacade, 'onChatReceived', fireIncoming);
    this.replaceEventHandler(() => {
      this.afterReceiveAdvice = after(ChatView.prototype, 'onReceived', () => {
        fireAfterReceive(...joinpoint().args);
      });
    });
    this.sendAdvice = before(chatFacade, 'sendChat', fireSend);
  },

  disable() {
    this.incomingAdvice.remove();
    this.afterReceiveAdvice.remove();
    this.sendAdvice.remove();
    Events.off('chat:receive', fireBeforeReceive);
  },

  // replace callback without affecting calling order
  replaceEventHandler(fn) {
    const chatView = this.ext.appView.room.chat;
    let handler;
    if (chatView) {
      handler = find(
        Events._events['chat:receive'], // eslint-disable-line no-underscore-dangle
        e => e.callback === chatView.onReceived,
      );
    }
    fn();
    if (chatView && handler) {
      handler.callback = chatView.onReceived;
    }
  },
});

export default MoreChatEvents;
