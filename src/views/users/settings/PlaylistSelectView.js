import $ from 'jquery';
import { View } from 'backbone';
import playlists from 'plug/collections/playlists';
import PlaylistSelectMenuView from './PlaylistSelectMenuView';

export default class PlaylistSelectView extends View {
  className = 'item extplug-playlist-select';

  initialize(o) {
    this.label = o.label;
    this.description = o.description;
    this.value = o.value ? playlists.get(o.value) : playlists.at(0);
  }

  render() {
    this.$label = $('<label />')
      .addClass('title')
      .text(this.label);
    this.$selected = $('<div />')
      .addClass('extplug-playlist-selected')
      .text(this.value.get('name'))
      .on('click', () => this.open());
    this.$el.append(this.$label, this.$selected);
    return this;
  }

  open() {
    const menu = new PlaylistSelectMenuView({
      selected: this.value,
    });
    menu.show(this.$selected);
    menu.on('select', (playlist) => {
      this.value = playlist;
      this.$selected.text(this.value.get('name'));
      this.trigger('change', playlist.get('id'));
    });
  }
}
