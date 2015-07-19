define(function (require, exports, module) {

  const GrabMenu = require('plug/views/grabs/grabMenu').constructor;
  const Media = require('plug/models/Media');
  const Lang = (0, require)('lang/Lang');

  const fakeMedia = [ new Media() ];

  const PlaylistSelectMenuView = GrabMenu.extend({
    className: 'pop-menu extplug-playlist-select-menu',

    // don't hide automatically on mouse leave
    onMouseLeave() {},

    // hide immediately on hide() calls.
    // plug has a little delay in here because it auto-hides the grab
    // menu when the mouse leaves the area.
    hide() {
      if (this._hide) this._hide();
      else this._super();
    },

    onDocClick(e) {
      // TODO check if e.target is child
      this.hide();
    },

    onRowPress(playlist) {
      this.trigger('select', playlist);
      this.hide();
    },

    show(el, container) {
      this._super(el, fakeMedia, container);
      this.$icon.removeClass('icon-add').addClass('icon-playlist');
      this.$title.text(Lang.playlist.yourPlaylists);

      // show the check mark in front of the selected playlist instead of the
      // active one
      this.rows.forEach(row => {
        if (row.model) {
          if (row.model.get('id') === this.options.selected.get('id')) {
            row.$el.append($('<i />').addClass('icon icon-check-purple'));
          }
          else if (row.model.get('active')) {
            row.$el.find('.icon-check-purple').remove();
          }
        }
      });
      return this;
    }
  });

  module.exports = PlaylistSelectMenuView;

});
