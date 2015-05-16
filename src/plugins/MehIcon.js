define('extplug/plugins/meh-icon/main', function (require, exports, module) {

  const Plugin = require('extplug/Plugin');
  const UserRowView = require('plug/views/rooms/users/RoomUserRowView');
  const $ = require('jquery');
  const { around } = require('meld');

  const MehIcon = Plugin.extend({
    name: 'Meh Icons',

    enable() {
      this._super();
      this.advice = around(UserRowView.prototype, 'vote', this.showVote);
      this.Style({
        '#user-lists .list.room .user .icon-meh': {
          'top': '-1px',
          'right': '9px',
          'left': 'auto'
        },
        // grab icon next to a vote icon
        '#user-lists .list.room .user .icon + .icon-grab': {
          'right': '28px'
        }
      });
    },

    disable() {
      this.advice.remove();
      this._super();
    },

    // bound to the UserRowView instance
    // shows all relevant vote icons instead of just grab or woot.
    showVote() {
      if (this.$icon) this.$icon.remove();
      this.$icon = $();
      if (this.model.get('vote') < 0) {
        this.$icon = this.$icon.add($('<i />').addClass('icon icon-meh extplug-meh-icon'));
      }
      if (this.model.get('vote') > 0) {
        this.$icon = this.$icon.add($('<i />').addClass('icon icon-woot'));
      }
      if (this.model.get('grab')) {
        this.$icon = this.$icon.add($('<i />').addClass('icon icon-grab'));
      }
      this.$icon.appendTo(this.$el);
    }
  });

  module.exports = MehIcon;

});
