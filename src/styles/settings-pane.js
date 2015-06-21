define({
  '#user-view #user-settings': {
    // unlike plug.dj's own settings, ExtPlug settings are grouped
    // in separate DOM elements (separate backbone views, even)
    // plug.dj's styling doesn't quite work for this so we add some
    // manual margins around the header to make things look somewhat
    // alike.
    '.extplug.control-group:not(:first-child) .header': {
      'margin': '35px 0 8px 0 !important'
    },

    // footer below grouped plugin settings
    '.extplug-group-footer': {
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
    },

    '.extplug-input': {
      'label.title': {
        'top': '0px',
        'font-size': '14px',
        'width': '50%'
      },
      'input': {
        'position': 'absolute',
        'background': 'rgba(17, 19, 23, 0.77)',
        'border': '1px solid #444a59',
        'padding': '1px',
        'font': '14px "Open Sans", sans-serif',
        'box-sizing': 'border-box',
        'color': '#808691',

        'height': '31px',
        'width': '47%',
        'left': '50%',
        'top': '-6px'
      },
      'input:focus': {
        'color': '#ccc',
        'border-color': '#009cdd'
      }
    }
  }
});
