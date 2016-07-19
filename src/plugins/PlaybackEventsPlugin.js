import $ from 'jquery';
import Events from 'plug/core/Events';
import Plugin from '../Plugin';

const PlaybackEventsPlugin = Plugin.extend({
  name: 'Playback Events',
  description: 'Add internal events for some playback-related actions: ' +
    'refresh, snooze, toggling HD video.',

  init(id, ext) {
    this._super(id, ext);

    this.onRefresh = this.onRefresh.bind(this);
    this.onHd = this.onHd.bind(this);
    this.onSnooze = this.onSnooze.bind(this);
  },

  enable() {
    $('#playback .refresh.button').on('click', this.onRefresh);
    $('#playback .hd.button').on('click', this.onHd);
    $('#playback .snooze.button').on('click', this.onSnooze);
  },

  disable() {
    $('#playback .refresh.button').off('click', this.onRefresh);
    $('#playback .hd.button').off('click', this.onHd);
    $('#playback .snooze.button').off('click', this.onSnooze);
  },

  onRefresh() {
    Events.trigger('playback:refresh');
  },

  onHd() {
    Events.trigger('playback:hdVideo');
  },

  onSnooze() {
    Events.trigger('playback:snooze');
  },
});

export default PlaybackEventsPlugin;
