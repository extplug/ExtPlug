define(function (require, exports, module) {

  var chatFacade = require('plug/facades/chatFacade'),
    { clone } = require('underscore'),
    Backbone = require('backbone');

  function onChatCommand(text) {
    var split = text.indexOf(' ');
    if (split === -1) {
      split = text.length;
    }
    var command = text.slice(1, split);
    var params = text.slice(split + 1);

    commands.trigger(command, params);
  }

  var commands = clone(Backbone.Events);

  var addedListener = false;
  chatFacade.registerCommand = function (command, callback) {
    if (!addedListener) {
      API.on(API.CHAT_COMMAND, onChatCommand);
    }
    commands.on(command, callback);
  };

  return chatFacade;

});
