// Mirrors plug.dj settings to the ExtPlug settings model, firing
// change events.

import { before } from 'meld';
import plugSettings from 'plug/store/settings';
import extMirror from '../store/settings';

let advice;

export function install() {
  advice = before(plugSettings, 'save', extMirror.update);
};

export function uninstall() {
  advice.remove();
};
