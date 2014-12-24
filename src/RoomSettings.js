define('extplug/RoomSettings', function (require, exports, module) {

  var currentRoom = require('plug/models/currentRoom'),
    request = require('extplug/util/request'),
    Backbone = require('backbone');

  var RoomSettings = Backbone.Model.extend({

    init: function (ext) {
      this._super();

      this._loaded = {};

      currentRoom.on('change:description', this.reload);
      ext.on('room:joined', this.load);
      ext.on('room:left', this.unload);

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
          request.json(m[1]).then(function (response) {
            this._loaded[m[1]] = response;
            this.onLoad(response);
          }.bind(this));
        }
      }
    },

    onLoad: function (settings) {
      this.clear();
      this.trigger('load', settings);
      this.set(settings);
    },

    unload: function () {
      this.trigger('unload');
    },

    reload: function () {
      if (currentRoom.get('joined')) {
        this.unload();
        this.load();
      }
    },

    dispose: function () {
      currentRoom.off('change:description', this.refresh);
    }

  });

  return RoomSettings;

});