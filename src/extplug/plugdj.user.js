;(function _initExtPlug() {

  if (window.API) {
    require([ 'extplug/boot' ]);
  }
  else {
    setTimeout(_initExtPlug, 20);
  }

}());
