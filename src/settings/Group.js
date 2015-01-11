define('extplug/settings/Group', function (require, exports, module) {

  var $ = require('jquery'),
    _ = require('underscore');

  /**
   * Creates an array with some setting group methods.
   * @param {?Array} group An array of setting items.
   */
  var Group = function (group) {
    if (!_.isArray(group)) {
      group = [];
    }
    /**
     * Renders the setting group.
     * @return {DocumentFragment} A DocumentFragment containing the setting group DOM.
     */
    group.render = function () {
      var el = document.createDocumentFragment();
      var switchAt = Math.ceil(this.length / 2 - 1),
        current = $('<div />').addClass('left').appendTo(el);
      this.forEach(function (item, i) {
        current.append(item.$el);
        item.render();
        if (i === switchAt) {
          current = $('<div />').addClass('right').appendTo(el);
        }
      });
      return el;
    };
    group.add = group.push;
    return group;
  };

  module.exports = Group;

});
