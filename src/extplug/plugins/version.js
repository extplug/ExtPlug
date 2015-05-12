define(function (require, exports, module) {
  const Plugin = require('../Plugin');
  const API = window.API;
  const _package = require('../package');

  const pad = x => x < 10 ? `0${x}` : x

  const ba = new Date(_package.builtAt)
  const builtAt = ba.getUTCFullYear() + '-'
                + pad(ba.getUTCMonth()   + 1) + '-'
                + pad(ba.getUTCDate()    + 1) + ' '
                + pad(ba.getUTCHours()   + 1) + ':'
                + pad(ba.getUTCMinutes() + 1) + ':'
                + pad(ba.getUTCSeconds() + 1) + ' UTC'

  const VersionPlugin = Plugin.extend({
    enable() {
      this._onCommand = this.onCommand.bind(this)
      API.on(API.CHAT_COMMAND, this._onCommand);
    },
    disable() {
      API.off(API.CHAT_COMMAND, this._onCommand);
    },

    onCommand(str) {
      if (/^\/version($|\s)/.test(str)) {
        API.chatLog(`${_package.name} v${_package.version} (${builtAt})`)
      }
    }
  });

  module.exports = VersionPlugin;

});