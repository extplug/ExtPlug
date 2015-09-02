import Plugin from '../Plugin';
import Events from 'plug/core/Events';
import chatFacade from 'plug/facades/chatFacade';
import receiver from 'plug/server/socketReceiver';
import currentRoom from 'plug/models/currentRoom';
import currentUser from 'plug/models/currentUser';
import { before } from 'meld';
import { defer, pick } from 'underscore';

const CHAT_INTERCEPT_STRING = `ExtPlugSocketIntercept${Math.random()}`;

// gives the user all permissions client-side temporarily, to make sure that
// a chat message will actually be passed to the socket.
function sudo(cb) {
  let originalUser = currentUser.toJSON();
  currentUser.set({
    id: 1,
    guest: false,
    level: 50,
    role: 5,
    gRole: 5
  }, { silent: true });

  let originalRoom = pick(currentRoom.toJSON(), 'joined', 'minChatLevel');
  currentRoom.set({
    joined: true,
    minChatLevel: 0
  }, { silent: true });

  // this forces the chat slowmode cooldown timer to always return 0, thus
  // working around slowmode
  let originalMax = Math.max;
  Math.max = () => 0

  cb();

  Math.max = originalMax;
  currentRoom.set(originalRoom, { silent: true });
  currentUser.set(originalUser, { silent: true });
}

function getSocket() {
  let _send = WebSocket.prototype.send;
  let socket;
  WebSocket.prototype.send = function (data) {
    if (data.indexOf(CHAT_INTERCEPT_STRING)) {
      socket = this;
      WebSocket.prototype.send = _send;
    }
  };
  sudo(() => {
    chatFacade.sendChat(CHAT_INTERCEPT_STRING);
  });

  // restore even if it didn't work
  WebSocket.prototype.send = _send;

  return socket;
}

const SocketEventsPlugin = Plugin.extend({
  enable() {
    let plugin = this;
    this.socket = getSocket();

    if (this.socket) {
      this.onConnect();
    }

    // make sure we still get an instance if the server reconnects, or
    // if ExtPlug loads before plug.dj connects, by overriding the WebSocket
    // constructor
    const WS = WebSocket;
    WebSocket = function (arg) {
      plugin.debug('instance', arg);
      let ws = new WS(arg);
      // wait for plug.dj to add handlers
      defer(() => {
        // find the socket object again, this new connection might be
        // instantiated by a plugin or another extension, and that should not
        // be intercepted
        plugin.socket = getSocket();
        plugin.onConnect();
      });
      return ws;
    };
    WebSocket.prototype = WS.prototype;

    this.WS = WS;
  },

  disable() {
    if (this.WS) WebSocket = this.WS;
    if (this.advice) this.advice.remove();

    this.WS = null;
    this.advice = null;
    this.socket = null;
  },

  onConnect() {
    if (this.advice) this.advice.remove();

    this.debug('patching', this.socket);

    this.advice = before(this.socket, 'onmessage', e => {
      if (e.data !== 'h') {
        this.debug('receive', e.data);
        JSON.parse(e.data).forEach(message => {
          Events.trigger(`socket:${message.a}`, message.p);
        });
      }
    });
  }
});

export default SocketEventsPlugin;
