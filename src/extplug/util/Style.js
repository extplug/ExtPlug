define(function (require, exports, module) {

  var _ = require('underscore'),
    $ = require('jquery');

  function Style(defaults) {
    this._rules = {};
    this._timeout = null;

    this.refresh = this.refresh.bind(this);

    this.el = $('<style>').attr('type', 'text/css').appendTo('head');

    if (_.isObject(defaults)) {
      this.set(defaults);
    }
  }

  Style.prototype.set = function (sel, props) {
    var rules = this._rules;
    if (props) {
      _.each(props, function (val, prop) {
        if (_.isObject(val)) {
          // nested rules
          this.set(sel + ' ' + prop, val);
        }
        else {
          if (!(sel in this._rules)) this._rules[sel] = {};
          this._rules[sel][prop] = val;
        }
      }, this);
    }
    else {
      _.each(sel, function (ruleset, selector) {
        this.set(selector, ruleset);
      }, this);
    }

    // throttle updates
    clearTimeout(this._timeout);
    this._timeout = setTimeout(this.refresh, 1);
    return this;
  };

  Style.prototype.refresh = function () {
    this.el.text(this.toString());
  };

  Style.prototype.remove = function () {
    this.el.remove();
  };

  Style.prototype.toString = function () {
    var str = '',
      rules = this._rules;
    Object.keys(rules).forEach(function (selector) {
      var ruleset = rules[selector];
      str += selector + ' {\n';
      Object.keys(ruleset).forEach(function (property) {
        str += '  ' + property + ': ' + ruleset[property] + ';\n';
      });
      str += '}\n\n';
    });
    return str;
  };

  return Style;

});
