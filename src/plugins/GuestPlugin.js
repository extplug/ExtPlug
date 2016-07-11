import $ from 'jquery';
import { around } from 'meld';
import Events from 'plug/core/Events';
import SaveSettingsAction from 'plug/actions/users/SaveSettingsAction';
import currentUser from 'plug/models/currentUser';
import Lang from 'lang/Lang';
import Plugin from '../Plugin';

const GuestPlugin = Plugin.extend({
  name: 'Guest UI',
  description: 'Skips the guest walkthrough and adds login and settings ' +
               'buttons to the plug.dj footer.',

  style: {
    /* eslint-disable quote-props */
    '.is-guest': {
      '#header-panel-bar': {
        '#chat-button': {
          'width': '33%',
          'span': { 'display': 'none' },
        },
        '#users-button': {
          'left': '33%',
          'width': '34%',
        },
        '#waitlist-button': {
          'left': '67%',
          'width': '33%',
        },
        '#friends-button': { 'display': 'none' },
      },
      '#user-lists': {
        // even the staff one doesn't work for guest users!
        '.button.staff, .button.ignored': { 'display': 'none' },
      },
      '#footer-user': {
        '.signup': { 'width': '40%' },
        '.signup.login': {
          'margin-left': 'calc(40% + 1px)',
          'width': 'calc(40% - 1px)',
          'background': '#555d70',
        },
        '.buttons': {
          'display': 'block',
          '.button': { 'display': 'none' },
          '.button.extplug-guest-settings': {
            'display': 'block',
            'margin-left': '80%',
          },
        },
      },
      '#user-menu .item:not(.settings)': {
        'display': 'none',
      },
      '#room-bar': {
        '.extplug-room-bar-overlay': {
          'height': 'inherit',
          'width': 'inherit',
          'position': 'absolute',
          'z-index': 10,
        },
      },
    },
    /* eslint-enable quote-props */
  },

  enable() {
    // Presumably, this isn't the first time someone has used plug.dj.
    this.skipWalkthrough();

    this.$settings = $('<div />')
      .addClass('button settings extplug-guest-settings')
      .attr('data-tooltip', Lang.userMenu.settings)
      .attr('data-tooltip-dir', 'left')
      .append($('<i />').addClass('icon icon-settings-white'))
      .appendTo('#footer-user .buttons')
      .on('click', this.onSettings);

    // add login button
    this.$signup = $('#footer-user .signup')
      .find('span')
        .text(Lang.signup.signup)
      .end();
    this.$login = $('<div />')
      .addClass('signup login')
      .append($('<span />').text(Lang.signup.login))
      .insertAfter(this.$signup)
      .on('click', this.login.bind(this));

    // disable saving settings to the server when not logged in
    this.ssaAdvice = around(SaveSettingsAction.prototype, 'execute', () => {
      // do nothing \o/
    });

    this.$roomBar = $('<div />').addClass('extplug-room-bar-overlay')
      .appendTo('#room-bar')
      .on('click', e => {
        e.stopPropagation();
        if ($('#room-settings').is(':visible')) {
          Events.trigger('hide:settings');
        } else {
          Events.trigger('show:settings');
        }
      });

    this.guestEnabled = true;
  },

  disable() {
    if (this.guestEnabled) {
      this.ssaAdvice.remove();
      this.$settings.remove();
      this.$roomBar.remove();
      this.$login.remove();
      this.$signup.find('span').text(Lang.signup.signupFree);
      this.$settings = this.$login = this.$signup = null;
    }

    this.guestEnabled = false;
  },

  skipWalkthrough() {
    const roomView = this.ext.appView.room;
    currentUser.off('change:walkthrough', roomView.onWTChange);
    roomView.onWTFinish();
  },

  login() {
    const app = this.ext.appView;
    app.showSignUp();
    app.signup.swap('login');
    // show email login by default
    $('.sign-up-overlay .box').addClass('show-email');
    $('.email-login input.email').focus();
  },

  onSettings(e) {
    e.stopPropagation();
    Events.trigger('tooltip:hide')
          .trigger('show:user', 'settings', 'extplug');
  },

});

export default GuestPlugin;
