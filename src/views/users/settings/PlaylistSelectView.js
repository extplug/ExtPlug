define(function (require, exports, module) {

  const PlaylistSelectMenuView = require('./PlaylistSelectMenuView');
  const { View } = require('backbone');
  const playlists = require('plug/collections/playlists');

  const PlaylistSelectView = View.extend({
    className: 'item extplug-playlist-select',

    initialize(o) {
      this.label = o.label;
      this.description = o.description;
      this.value = o.value ? playlists.get(o.value) : playlists.at(0);
    },

    render() {
      this.$label = $('<label />')
        .addClass('title')
        .append($('<span />').text(this.label));
      this.$selected = $('<div />')
        .addClass('extplug-playlist-selected')
        .text(this.value.get('name'))
        .on('click', () => this.open());
      this.$el.append(this.$label, this.$selected);
      return this;
    },

    open() {
      let menu = new PlaylistSelectMenuView();
      menu.show(this.$selected);
      menu.on('select', playlist => {
        this.value = playlist;
        this.$selected.text(this.value.get('name'));
        this.trigger('change', playlist.get('id'));
      });
    }
  });

  module.exports = PlaylistSelectView;

});
