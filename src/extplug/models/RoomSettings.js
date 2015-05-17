define(function (require, exports, module) {

  var currentRoom = require('plug/models/currentRoom'),
    request = require('extplug/util/request'),
    Backbone = require('backbone'),
    Events = require('plug/core/Events');

  var RoomSettings = Backbone.Model.extend({

    constructor(ext) {
      Backbone.Model.call(this, {});

      this._loaded = {};

      this.load   = this.load.bind(this);
      this.unload = this.unload.bind(this);
      this.reload = this.reload.bind(this);

      currentRoom.on('change:description', this.reload);

      if (currentRoom.get('joined')) {
        this.load();
      }
    },

    load() {
      let description = currentRoom.get('description'),
        m = description.match(/(?:^|\n)@(?:p3|rcs)=(.*?)(?:\n|$)/);

      if (m) {
        request.json(m[1]).then(settings => {
          this.clear();
          this.set(settings);
          this.trigger('load', settings);
        }).fail(e => {
          let message = ''
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
    },

    unload() {
      this.clear();
      this.trigger('unload');
    },

    reload() {
      this.unload();
      // "joined" is set *after* "description"
      _.defer(() => {
        if (currentRoom.get('joined')) {
          this.load();
        }
      });
    },

    dispose() {
      this.unload();
      currentRoom.off('change:description', this.reload);
    }

  });

  module.exports = RoomSettings;

});
