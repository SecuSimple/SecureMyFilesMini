(function (root) {


  //exposing the namespace
  if (typeof exports !== 'undefined') { //exports
    exports.smf = smf;
  } else if (typeof define === 'function' && define.amd) { //AMD
    define('smf', [], function () {
      return smf;
    });
  } else {
    root.smf = smf; //global 
  }
})(this);