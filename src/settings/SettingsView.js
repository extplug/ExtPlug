define('extplug/settings/SettingsView', function (require, exports, module) {
  var Backbone = require('backbone'),
    $ = require('jquery');

  var SettingsView = Backbone.View.extend({
    className: 'ext-plug section',

    initialize: function () {
      this.groups = [];
    },

    render: function () {
      var container = $('<div>').addClass('container');
      this.$el.empty().append(container);

      this.sort();
      this.groups.forEach(function (group) {
        container.append($('<div>').addClass('header').append($('<span>').text(group.name)));
        container.append(group.items.render());
      }, this);

      return this;
    },

    sort: function () {
      this.groups.sort(function (a, b) {
        var c = b.priority - a.priority;
        if (c === 0) {
          c = a.name > b.name ? 1 : a.name < b.name ? -1 : 0;
        }
        return c;
      });
    },

    onResize: function () {
    },

    addGroup: function (name, items, priority) {
      this.groups.push({
        name: name,
        items: items,
        priority: typeof priority === 'number' ? priority : 0
      });
    },

    getGroup: function (name) {
      for (var i = 0, l = this.groups.length; i < l; i++) {
        if (this.groups[i].name === name) {
          return this.groups[i].items;
        }
      }
    },

    hasGroup: function (name) {
      return this.groups.some(function (group) {
        return group.name === name;
      });
    },

    removeGroup: function (name) {
      for (var i = 0, l = this.groups.length; i < l; i++) {
        if (this.groups[i].name === name) {
          return this.groups.splice(i, 1);
        }
      }
    }

  });

  module.exports = SettingsView;

});