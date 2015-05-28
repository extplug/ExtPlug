define(function (require, exports, module) {

  const $ = require('jquery');
  const _ = require('underscore');
  const sistyl = require('sistyl');
  const Class = require('plug/core/Class');
  const popoutView = require('plug/views/rooms/popout/PopoutView');

  const Style = Class.extend({
    init(defaults) {
      this._sistyl = sistyl(defaults);
      this._timeout = null;

      this.refresh = this.refresh.bind(this);
      this.id = _.uniqueId('eps-');

      this.el = $('<style />').addClass('extplug-style')
                              .attr('id', this.id)
                              .attr('type', 'text/css')
                              .appendTo('head');
      if (popoutView._window) {
        this.el.clone().appendTo(popoutView.$document.find('head'));
      }
      this.refresh();
    },

    $() {
      let el = this.el;
      if (popoutView._window) {
        el = el.add(popoutView.$document.find(`#${this.id}`));
      }
      return el;
    },

    set(sel, props) {
      this._sistyl.set(sel, props);

      // throttle updates
      clearTimeout(this._timeout);
      this._timeout = setTimeout(this.refresh, 1);
      return this;
    },

    refresh() {
      this.$().text(this.toString());
    },

    remove() {
      this.$().remove();
    },

    toString() {
      return this._sistyl.toString();
    }

  });

  module.exports = Style;

});
