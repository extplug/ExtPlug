define(function (require, exports, module) {

  const chatFacade = require('plug/facades/chatFacade');
  const { clone } = require('underscore');
  const Backbone = require('backbone');

  function onChatCommand(text) {
    let split = text.indexOf(' ');
    if (split === -1) {
      split = text.length;
    }
    let command = text.slice(1, split);
    let params = text.slice(split + 1);

    commands.trigger(command, params);
  }

  let commands = clone(Backbone.Events);

  let addedListener = false;
  chatFacade.registerCommand = function (command, callback) {
    if (!addedListener) {
      API.on(API.CHAT_COMMAND, onChatCommand);
    }
    commands.on(command, callback);
  };

  return chatFacade;

});
