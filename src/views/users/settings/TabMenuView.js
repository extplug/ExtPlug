import SettingsTabMenuView from 'plug/views/users/settings/TabMenuView';
import $ from 'jquery';

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
      this.select('ext-plug');
    }
  }

});

export default TabMenuView;
