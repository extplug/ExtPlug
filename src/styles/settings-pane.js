define({
  // unlike plug.dj's own settings, ExtPlug settings are grouped
  // in separate DOM elements (separate backbone views, even)
  // plug.dj's styling doesn't quite work for this so we add some
  // manual margins around the header to make things look somewhat
  // alike.
  '.extplug.control-group:not(:first-child) .header': {
    'margin': '35px 0 8px 0 !important'
  },

  // footer below grouped plugin settings
  // with a disgusting specificity hack!
  '#user-view #user-settings .extplug-group-footer': {
    'clear': 'both',
    'button': {
      'top': 'auto',
      'position': 'relative'
    }
  },

  // numeric range slider
  '.extplug-slider': {
    // plug.dj has three labels on sliders, but ExtPlug sliders
    // just have two counter labels because it's easier
    '.counts .count:nth-child(2)': {
      'float': 'right'
    }
  }
});
