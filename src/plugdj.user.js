//= ExtPlug
//= Style
//= Module
//= util/function
//= util/request
//= RoomSettings
//= models/Settings
//= models/Module
//= views/BaseView
//= views/users/settings/SettingsView
//= views/users/settings/TabMenuView
//= views/users/settings/ControlGroupView
//= views/users/settings/CheckboxView
//= views/users/settings/DropdownView
//= views/users/settings/ErrorCheckboxView

//= modules/Autowoot
//= modules/ChatNotifications
//= modules/RoomStyles
//= modules/MehIcon
//= modules/RolloverBlurbs
//= modules/FullSizeVideo

;(function _initExtPlug() {

  if (window.API) {
    //= ../node_modules/plug-modules/plug-modules
    plugModules.register();
    require([ 'extplug/ExtPlug' ], function (ExtPlug) {

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

}());
