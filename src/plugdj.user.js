//= ExtPlug
//= Style
//= Module
//= hooks/chat
//= util/function
//= util/request
//= models/Settings
//= models/RoomSettings
//= models/Module
//= collections/ModulesCollection
//= views/BaseView
//= views/users/ExtUserView
//= views/users/settings/SettingsView
//= views/users/settings/TabMenuView
//= views/users/settings/ControlGroupView
//= views/users/settings/CheckboxView
//= views/users/settings/DropdownView
//= views/users/settings/ErrorCheckboxView

//= modules/Autowoot
//= modules/ChatNotifications
//= modules/CompactHistory
//= modules/RoomStyles
//= modules/MehIcon
//= modules/RolloverBlurbs
//= modules/FullSizeVideo

;(function _initExtPlug() {

  if (window.API) {
    //= ../node_modules/plug-modules/plug-modules
    plugModules.register();
    require([ 'extplug/ExtPlug' ], function _loaded(ExtPlug) {
      if (!appViewExists()) {
        return setTimeout(function () {
          _loaded(ExtPlug)
        }, 20);
      }

      var cbs = window.extp || [];
      var ext = new ExtPlug();
      window.extp = ext;

      ext.init();
      cbs.forEach(function (cb) {
        cb(ext);
      });

    });
  }
  else {
    setTimeout(_initExtPlug, 20);
  }

  function appViewExists() {
    try {
      // the ApplicationView attaches an event handler on instantiation.
      var AppView = plugModules.require('plug/views/app/ApplicationView'),
        evts = plugModules.require('plug/core/Events')._events['show:room'];
      return evts.some(function (event) { return event.ctx instanceof AppView; });
    }
    catch (e) {
      return false;
    }
  }

}());
