/**
 * Initializes the random number generator
 */
var randomGenerator = function () {
  var attached = false,
    entropy = [];

  /**
   * Initializes the generator
   */
  var checkEvents = function () {
    if (typeof document === 'undefined') {
      return;
    }

    if (!attached && entropy.length <= 102400) {
      document.addEventListener('mousemove', collectEntropy);
      attached = true;
    } else if (attached && entropy.length > 102400) {
      document.removeEventListener('mousemove', collectEntropy);
      attached = false;
    }
  };

  /**
   * Collects entropy from user
   */
  var collectEntropy = function (e) {
    entropy.push(e.screenX);
    entropy.push(e.screenY);
    checkEvents();
  };

  /**
   * Generate new random 128-bit key, based on entropy
   */
  this.generate = function () {
    var ent, dat, num, result = [];
    for (var i = 0; i < 16; i++) {
      ent = entropy.length > 1 ? entropy.splice(i, 2) : [Math.random() * 10, Math.random() * 10];
      dat = new Date();
      num = (ent.length === 2) ? ((ent[0] * Math.random() + ent[1] * Math.random()) / 10) : (Math.random() * 10 + Math.random() * 100 + Math.random() * 1000) / 100;

      result[i] = parseInt(num * dat.getMilliseconds() / 10);
      while (result[i] > 255) {
        result[i] -= 255;
      }
    }

    checkEvents();
    return result;
  };

  checkEvents();
};

//exports
module.exports = randomGenerator;