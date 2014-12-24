//= ExtPlug
//= Style
//= Module
//= util/function
//= util/request
//= RoomSettings
//= settings/Settings
//= settings/SettingsView
//= settings/Group
//= settings/CheckboxView
//= settings/ErrorCheckboxView

//= modules/Autowoot
//= modules/ChatNotifications
//= modules/RoomStyles
//= modules/MehIcon
//= modules/FullSizeVideo

!(function _initExtPlug() {

  if (window.API) {
    //= ../node_modules/plug-modules/plug-modules
    require([ 'extplug/ExtPlug' ], function (ExtPlug) {

      var cbs = window.extp || [];
      var ext = new ExtPlug();
      window.extp = ext;

      ext.init();
      cbs.forEach(function (cb) {
        cb(ext);
      });

    })
  }
  else {
    setTimeout(_initExtPlug, 20);
  }

}());
