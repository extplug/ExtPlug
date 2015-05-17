define(function (require, exports, module) {

  const Backbone = require('backbone');
  const $ = require('jquery');
  const _ = require('underscore');

  const DropdownView = Backbone.View.extend({
    className: 'dropdown',
    tagName: 'dl',
    initialize() {
      if (!this.options.selected) {
        this.options.selected = Object.keys(this.options.options)[0];
      }

      this.onDocumentClick = this.onDocumentClick.bind(this);
      this.onBaseClick = this.onBaseClick.bind(this);
      this.onRowClick = this.onRowClick.bind(this);
    },
    render() {
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
    close() {
      this.$el.removeClass('open');
      $(document).off('click', this.onDocumentClick);
    },
    remove() {
      this.$('dt, dd').off();
      $(document).off('click', this.onDocumentClick);
      this._super();
    },
    onBaseClick(e) {
      if (this.$el.hasClass('open')) {
        this.close();
      }
      else {
        this.$el.addClass('open');
        _.defer(() => {
          $(document).on('click', this.onDocumentClick);
        });
      }
    },
    onRowClick(e) {
      let row = $(e.target).closest('.row');
      this.$('.row').removeClass('selected');
      row.addClass('selected');
      this.$el.removeClass('open');
      this.$selectedValue.text(row.text());
      this.trigger('select', row.data('value'));
    },
    onDocumentClick(e) {
      _.defer(this.close.bind(this));
    },
    getValue() {
      return this.$rows.find('.selected').data('value');
    },
    setValue() {
      
    }
  });

  module.exports = DropdownView;

});
