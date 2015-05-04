define(function (require, exports, module) {

  var currentRoom = require('plug/models/currentRoom'),
    request = require('extplug/util/request'),
    fnUtils = require('extplug/util/function'),
    Backbone = require('backbone'),
    Events = require('plug/core/Events');

  var RoomSettings = Backbone.Model.extend({

    constructor: function (ext) {
      Backbone.Model.call(this, {});

      this._loaded = {};

      fnUtils.bound(this, 'load');
      fnUtils.bound(this, 'unload');
      fnUtils.bound(this, 'reload');

      currentRoom.on('change:description', this.reload);
      Events.on('room:joined', this.load);

      if (currentRoom.get('joined')) {
        this.load();
      }
    },

    load: function () {
      var description = currentRoom.get('description'),
        m = description.match(/(?:^|\n)@p3=(.*?)(?:\n|$)/);

      if (m) {
        if (this._loaded[m[1]]) {
          this.onLoad(this._loaded[m[1]]);
        }
        else {
          request.json(m[1])
            .then(function (response) {
              this._loaded[m[1]] = response;
              this.onLoad(response);
            }.bind(this))
            .fail(function (e) {
              var message = ''
              if (e.status === 0) {
                message += ' Your browser or an extension may be blocking its URL.';
              }
              else if (e.status >= 400) {
                message += ' Its URL is not accessible.';
              }
              else if (e.status) {
                message += ' Status code: ' + e.status;
              }
              Events.trigger('notify', 'icon-chat-system',
                             'Room Settings could not be loaded for this room.' + message);
            });
        }
      }
    },

    onLoad: function (settings) {
      this.clear();
      this.trigger('load', settings);
      this.set(settings);
    },

    unload: function () {
      this.clear();
      this.trigger('unload');
    },

    reload: function () {
      if (currentRoom.get('joined')) {
        this.unload();
        this.load();
      }
    },

    dispose: function () {
      currentRoom.off('change:description', this.reload);
    }

  });

  module.exports = RoomSettings;

});
