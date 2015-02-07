define('extplug/settings/DropdownView', function (require, exports, module) {

  var Backbone = require('backbone'),
    $ = require('jquery'),
    _ = require('underscore'),
    fnUtils = require('extplug/util/function');

  var DropdownView = Backbone.View.extend({
    className: 'dropdown',
    tagName: 'dl',
    initialize: function () {
      if (!this.options.selected) {
        this.options.selected = Object.keys(this.options.options)[0];
      }

      fnUtils.bound(this, 'onDocumentClick');
      fnUtils.bound(this, 'onBaseClick');
      fnUtils.bound(this, 'onRowClick');
    },
    render: function () {
      this.$selectedValue = $('<span />');
      this.$selected = $('<dt />')
        .append(this.$selectedValue)
        .append($('<i />').addClass('icon icon-arrow-down-grey'))
        .append($('<i />').addClass('icon icon-arrow-up-grey'));

      this.$rows = $('<dd />');
      var selected;
      _.each(this.options.options, function (text, value) {
        var row = $('<div />').addClass('row').data('value', value),
          el = $('<span />').text(text);
        if (this.options.selected === value) {
          selected = row;
        }
        row.append(el).appendTo(this.$rows);
      }, this);

      this.$el
        .append(this.$selected)
        .append(this.$rows);

      this.$selected.on('click', this.onBaseClick);
      this.$rows.on('click', this.onRowClick);
      // trigger the above as a default
      if (selected) {
        selected.click();
      }
      return this;
    },
    close: function () {
      this.$el.removeClass('open');
      $(document).off('click', this.onDocumentClick);
    },
    remove: function () {
      this.$('dt, dd').off();
      $(document).off('click', this.onDocumentClick);
      this._super();
    },
    onBaseClick: function (e) {
      if (this.$el.hasClass('open')) {
        this.close();
      }
      else {
        this.$el.addClass('open');
        var self = this;
        _.defer(function () { $(document).on('click', self.onDocumentClick); });
      }
    },
    onRowClick: function (e) {
      var row = $(e.target).closest('.row');
      this.$('.row').removeClass('selected');
      row.addClass('selected');
      this.$el.removeClass('open');
      this.$selectedValue.text(row.text());
      this.trigger('select', row.data('value'));
    },
    onDocumentClick: function (e) {
      _.defer(this.close.bind(this));
    },
    getValue: function () {
      return this.$rows.find('.selected').data('value');
    },
    setValue: function () {
      
    }
  });

  module.exports = DropdownView;

});
