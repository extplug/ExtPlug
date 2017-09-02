import { defer } from 'underscore';
import Backbone from 'backbone';
import currentRoom from 'plug/models/currentRoom';
import util from 'plug/util/util';
import Events from 'plug/core/Events';
import { json as getJson } from '../util/request';

const RoomSettings = Backbone.Model.extend({
  constructor() {
    Backbone.Model.call(this, {});

    this.load = this.load.bind(this);
    this.unload = this.unload.bind(this);
    this.reload = this.reload.bind(this);

    currentRoom.on('change:description', this.reload);

    if (currentRoom.get('joined')) {
      this.load();
    }
  },

  load(unload = false) {
    const description = currentRoom.get('description');
    const m = description.match(/(?:^|\n)@(?:p3|rcs)=(.*?)(?:\n|$)/);

    if (m) {
      const url = util.h2t(m[1]);
      getJson(url).then((settings) => {
        if (unload) {
          this.unload();
        } else {
          this.clear();
        }
        this.set(settings);
        this.trigger('load', settings);
      }).fail((e) => {
        this.unload();
        let message = '';
        if (e.status === 0) {
          message += ' Your browser or an extension may be blocking its URL.';
        } else if (e.status >= 400) {
          message += ' Its URL is not accessible.';
        } else if (e.status) {
          message += ` Status code: ${e.status}`;
        }
        Events.trigger(
          'notify', 'icon-chat-system',
          `Room Settings could not be loaded for this room.${message}`,
        );
      });
    } else if (unload) {
      this.unload();
    }
  },

  unload() {
    this.clear();
    this.trigger('unload');
  },

  reload() {
    // "joined" is set *after* "description"
    defer(() => {
      if (currentRoom.get('joined')) {
        this.load(true);
      }
    });
  },

  dispose() {
    this.unload();
    currentRoom.off('change:description', this.reload);
  },
});

export default RoomSettings;
