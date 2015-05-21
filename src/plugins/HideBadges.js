define('extplug/plugins/hide-badges/main', function (require, exports, module) {

  const Plugin = require('extplug/Plugin');

  const HideBadges = Plugin.extend({
    name: 'Hide Badges',
    description: 'Hides user chat badges.',

    enable() {
      this._super();
      this.Style({
        '#chat': {
          '.msg': { padding: '5px 8px 6px 8px' },
          '.badge-box': { display: 'none' }
        }
      });
    }

  });

  module.exports = HideBadges;

});
