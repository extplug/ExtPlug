define(function (require, exports, module) {

  const SettingsTabMenuView = require('plug/views/users/settings/TabMenuView');
  const $ = require('jquery');

  const TabMenuView = SettingsTabMenuView.extend({

    render() {
      this._super();
      let extPlugTab = $('<button />').addClass('ext-plug').text('ExtPlug');
      this.$el.append(extPlugTab);
      extPlugTab.on('click', this.onClickExt.bind(this));

      let buttons = this.$('button');
      buttons.css('width', 100 / buttons.length + '%');
      return this;
    },

    onClickExt(e) {
      let button = $(e.target);
      if (button.hasClass('ext-plug') && !button.hasClass('selected')) {
        this.selectExtPlug();
      }
    },

    selectExtPlug() {
      this.$('button').removeClass('selected');
      this.$('button.ext-plug').addClass('selected');
      this.trigger('select', 'ext-plug');
    }

  });

  module.exports = TabMenuView;

});
