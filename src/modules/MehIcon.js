(extp = window.extp || []).push(function (ext) {

  ext.define('MehIcon', function (require, exports, module) {

    var Module = require('extplug/Module'),
      UserRowView = require('plug/views/rooms/users/RoomUserRowView'),
      $ = require('jquery');

    var MehIcon = Module({
      name: 'Meh Icons',

      enable: function () {
        var mehIcon = this;
        this._vote = UserRowView.prototype.vote;
        UserRowView.prototype.vote = function () {
          mehIcon._vote.call(this);
          mehIcon.showMeh.call(this);
        };
        this.Style({
          '#user-lists .list.room .user .icon-meh': {
            'top': '-1px',
            'right': '9px',
            'left': 'auto'
          }
        });
      },

      disable: function () {
        UserRowView.prototype.vote = this._vote;
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

});