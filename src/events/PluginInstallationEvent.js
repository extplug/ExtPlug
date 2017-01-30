import Event from 'plug/events/Event';

const PluginInstallationEvent = Event.extend({
  init(type, { name, url }) {
    this._super(type);

    this.name = name;
    this.url = url || `https://unpkg.com/${name}`;
  },
});

// eslint-disable-next-line no-underscore-dangle
PluginInstallationEvent._name = 'extplug:PluginInstallationEvent';
PluginInstallationEvent.INSTALL = 'extplug:PluginInstallationEvent:INSTALL';
PluginInstallationEvent.UNINSTALL = 'extplug:PluginInstallationEvent:UNINSTALL';

export default PluginInstallationEvent;
