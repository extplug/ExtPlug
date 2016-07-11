import SettingsTabMenuView from 'plug/views/users/settings/TabMenuView';
import $ from 'jquery';

export default class TabMenuView extends SettingsTabMenuView {
  render() {
    super.render();
    const extPlugTab = $('<button />').addClass('ext-plug').text('ExtPlug');
    this.$el.append(extPlugTab);
    extPlugTab.on('click', this.onClickExt.bind(this));

    const buttons = this.$('button');
    buttons.css('width', `${100 / buttons.length}%`);
    return this;
  }

  onClickExt(e) {
    const button = $(e.target);
    if (button.hasClass('ext-plug') && !button.hasClass('selected')) {
      this.select('ext-plug');
    }
  }
}
