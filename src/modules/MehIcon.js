define('extplug/modules/meh-icon/main', function (require, exports, module) {

  var Module = require('extplug/Module'),
    UserRowView = require('plug/views/rooms/users/RoomUserRowView'),
    $ = require('jquery'),
    meld = require('meld');

  var MehIcon = Module.extend({
    name: 'Meh Icons',

    enable: function () {
      this._super();
      this.advice = meld.after(UserRowView.prototype, 'vote', this.showMeh);
      this.Style({
        '#user-lists .list.room .user .icon-meh': {
          'top': '-1px',
          'right': '9px',
          'left': 'auto'
        }
      });
    },

    disable: function () {
      this.advice.remove();
      this._super();
    },

    showMeh: function () {
      if (this.model.get('vote') === -1 && !this.model.get('grab')) {
        if (!this.$icon) {
          this.$icon = $('<i />');
          this.$el.append(this.$icon);
        }
        this.$icon.removeClass().addClass('icon icon-meh extplug-meh-icon');
      }
    }
  });

  module.exports = MehIcon;

});

(extp = window.extp || []).push('extplug/modules/meh-icon/main');
