define(function (require, exports, module) {

  const $ = require('jquery');
  const _ = require('underscore');
  const sistyl = require('sistyl');
  const popoutView = require('plug/views/rooms/popout/PopoutView');

  function Style(defaults) {
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
  }

  Style.prototype.$ = function () {
    let el = this.el;
    if (popoutView._window) {
      el = el.add(popoutView.$document.find(`#${this.id}`));
    }
    return el;
  };

  Style.prototype.set = function (sel, props) {
    this._sistyl.set(sel, props);

    // throttle updates
    clearTimeout(this._timeout);
    this._timeout = setTimeout(this.refresh, 1);
    return this;
  };

  Style.prototype.refresh = function () {
    this.$().text(this.toString());
  };

  Style.prototype.remove = function () {
    this.$().remove();
  };

  Style.prototype.toString = function () {
    return this._sistyl.toString();
  };

  return Style;

});
