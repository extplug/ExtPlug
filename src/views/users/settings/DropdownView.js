define(function (require, exports, module) {

  const Backbone = require('backbone');
  const $ = require('jquery');
  const { each, defer } = require('underscore');

  const DropdownView = Backbone.View.extend({
    className: 'extplug-dropdown',

    initialize() {
      if (!this.options.selected) {
        this.options.selected = Object.keys(this.options.options)[0];
      }

      this.onDocumentClick = this.onDocumentClick.bind(this);
    },

    render() {
      this.$label = $('<label />').addClass('title').text(this.options.label);
      this.$dl = $('<dl />').addClass('dropdown');
      this.$selectedValue = $('<span />');
      this.$selected = $('<dt />')
        .append(this.$selectedValue)
        .append($('<i />').addClass('icon icon-arrow-down-grey'))
        .append($('<i />').addClass('icon icon-arrow-up-grey'));

      this.$rows = $('<dd />');
      let selected;
      each(this.options.options, (text, value) => {
        let row = $('<div />').addClass('row').data('value', value);
        let el = $('<span />').text(text);
        if (this.options.selected === value) {
          selected = row;
        }
        row.append(el).appendTo(this.$rows);
      });

      this.$dl
        .append(this.$selected)
        .append(this.$rows);

      this.$el
        .append(this.$label)
        .append(this.$dl);

      this.$selected.on('click', this.onBaseClick.bind(this));
      this.$rows.on('click', this.onRowClick.bind(this));
      // trigger the above as a default
      if (selected) {
        selected.click();
      }
      return this;
    },

    remove() {
      this.$('dt, dd').off();
      $(document).off('click', this.onDocumentClick);
      this._super();
    },

    close() {
      this.$dl.removeClass('open extplug-dropdown-up');
      $(document).off('click', this.onDocumentClick);
    },

    onBaseClick(e) {
      if (this.$dl.hasClass('open')) {
        this.close();
      }
      else {
        if (this.canExpandDownward()) {
          this.$dl.addClass('open');
        }
        else {
          this.$dl.addClass('open extplug-dropdown-up');
        }
        defer(() => {
          $(document).on('click', this.onDocumentClick);
        });
      }
    },

    onRowClick(e) {
      let row = $(e.target).closest('.row');

      this.$rows.children().removeClass('selected');
      row.addClass('selected');
      this.$selectedValue.text(row.text());
      this.trigger('change', row.data('value'));

      // will be closed by onDocumentClick()
    },

    onDocumentClick(e) {
      defer(() => {
        this.close();
      });
    },

    canExpandDownward() {
      let top = this.$dl.offset().top;
      let bottom = top + this.$rows.height();
      return bottom < $(document).height();
    }
  });

  module.exports = DropdownView;

});
