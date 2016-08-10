import * as meld from 'meld';
import Plugin from '../Plugin';
import * as request from './request';
import getUserClasses from './getUserClasses';
import Style from './Style';

window.define('meld', () => meld);
window.define('extplug/Plugin', () => Plugin);
window.define('extplug/util/request', () => request);
window.define('extplug/util/getUserClasses', () => getUserClasses);
window.define('extplug/util/Style', () => Style);
