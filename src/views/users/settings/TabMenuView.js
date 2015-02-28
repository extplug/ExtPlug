define('extplug/views/users/settings/TabMenuView', function (require, exports, module) {

  var SettingsTabMenuView = require('plug/views/users/settings/TabMenuView'),
    $ = require('jquery');

  return SettingsTabMenuView.extend({

    render: function () {
      this._super();
      var extPlugTab = $('<button />').addClass('ext-plug').text('ExtPlug');
      this.$el.append(extPlugTab);
      extPlugTab.on('click', this.onClickExt.bind(this));

      var buttons = this.$('button');
      buttons.css('width', 100 / buttons.length + '%');
      return this;
    },

    onClickExt: function (e) {
      if ($(e.target).hasClass('ext-plug')) {
        this.trigger('select', 'ext-plug');
      }
    }

  });

})