(function () {
  var screen1 = document.getElementById('screen1'),
    screen2 = document.getElementById('screen2'),
    filePass = document.getElementById('filePass'),
    fileName = document.getElementById('fileName'),
    status = document.getElementById('status'),
    hlabel = document.getElementById('hlabel'),
    errh = document.getElementById('errh'),
    progressThumb = document.getElementById('progressThumb'),
    fileBox = document.getElementById('fileBox'),
    processed = 0;

  var reset = function () {
    var clone = fileBox.cloneNode(false);
    fileBox.parentNode.replaceChild(clone, fileBox);
    fileBox = document.getElementById('fileBox');
    fileBox.addEventListener('change', fileOnChange);

    filePass.value = '';
    fileName.value = '';
    status.style.display = 'none';
    screen2.style.display = 'none';
    screen1.style.display = 'block';
    errh.style.display = 'none';
  };

  var fileOnChange = function () {
    screen1.style.display = 'none';
    screen2.style.display = 'block';
    hlabel.innerHTML = 'Protect your files';
    fileName.value = fileBox.files[0].name;
    fileName.setAttribute('title', fileBox.files[0].name);
  };

  var success = function () {
    reset();
    processed = 0;
    hlabel.innerHTML = 'Done. Protect more files';
    errh.style.display = 'none';
    progressThumb.style.width = 0;
    filePass.setAttribute('class', 'text');
    hlabel.removeAttribute('class');
  };

  var error = function (code) {
    var err = '';
    switch (code) {
    case 1:
      err = 'Incorrect password or file is corrupt.';
      break;
    case 2:
      err = 'Password cannot be blank.';
      break;
    case 3:
      err = 'Password must be at least 4 characters long.';
      break;
    }
    processed = 0;
    progressThumb.style.width = 0;
    filePass.value = '';
    screen2.style.display = 'block';
    status.style.display = 'none';
    errh.style.display = 'block';
    hlabel.innerHTML = 'Error!';
    errh.innerHTML = err;
    filePass.setAttribute('class', 'text haserror');
    hlabel.setAttribute('class', 'haserrorh');
  };

  var handleProgress = function (procAmount, total) {
    processed += procAmount;
    var wdt = parseInt(processed / total * 100);

    progressThumb.style.width = wdt.toString() + '%';
  };

  var validatePass = function () {
    if (!filePass.value.length) {
      error(2);
      return false;
    }
    if (filePass.value.length < 4) {
      error(3);
      return false;
    }
    return true;
  };

  var smfInst = new smf(success, error, handleProgress);
  fileBox.addEventListener('change', fileOnChange);

  window.encrypt = function () {
    if (!validatePass()) {
      return;
    }
    hlabel.removeAttribute('class');
    screen2.style.display = 'none';
    status.style.display = 'block';
    hlabel.innerHTML = "Processing...";
    smfInst.encryptFile(fileBox.files[0], filePass.value);
  };

  window.decrypt = function () {
    if (!validatePass()) {
      return;
    }
    hlabel.removeAttribute('class');
    screen2.style.display = 'none';
    status.style.display = 'block';
    hlabel.innerHTML = "Processing...";
    smfInst.decryptFile(fileBox.files[0], filePass.value);
  };
})();