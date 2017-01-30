import Events from 'plug/core/Events';
import ShowDialogEvent from 'plug/events/ShowDialogEvent';
import PluginInstallationEvent from '../events/PluginInstallationEvent';
import LoadingDialog from '../views/dialogs/LoadingDialog';

export default function pluginInstallationHandler(extp) {
  const manager = extp.manager;

  function onInstall(event) {
    const dialog = new LoadingDialog({
      name: event.name,
    });
    Events.dispatch(new ShowDialogEvent(ShowDialogEvent.SHOW, dialog));

    manager.install(event.url).catch((err) => {
      console.error(err);
    }).then(() => {
      dialog.close();
    });
  }

  function onUninstall(event) {
    Events.trigger('notify', 'icon-extplug-plugins', `Uninstalling ${event.name}…`);
    manager.uninstall(event.name)
      .then(() => {
        Events.trigger('notify', 'icon-extplug-plugins', `Plugin ${event.name} removed.`);
      })
      .catch((err) => {
        console.error(err);
      });
  }

  Events.on(PluginInstallationEvent.INSTALL, onInstall);
  Events.on(PluginInstallationEvent.UNINSTALL, onUninstall);

  return () => {
    Events.off(PluginInstallationEvent.INSTALL, onInstall);
    Events.off(PluginInstallationEvent.UNINSTALL, onUninstall);
  };
}
