import pluginInstallationHandler from './pluginInstallationHandler';

export default function allHandlers(extp) {
  const subscriptions = [
    pluginInstallationHandler(extp),
  ];

  return () => {
    subscriptions.forEach(unsubscribe => unsubscribe());
  };
}
