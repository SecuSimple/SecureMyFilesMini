Secure My Files Mini
=============
Secure My Files Mini, or SMF is a JavaScript library for securing documents using end-to-end encryption in the browser.
SMF is using symmetric encryption algorithms (AES with a 256-bit cypher) to encrypt and decrypt files.

##Usage

####As an application
Secure My Files can be used as an application, already deployed at http://secusimple.com/smf
You can deploy the sources available here on your own server. Everything is static, so any web server will do.

####As a library
It's simple to use SMF as a library. You first need to include the JavaScript script into the page.
```html
<script type="text/javascript" src="build/securemyfiles.min.js"></script>
```
Then you need to instantiate SMF 
```js
var smfInst = new smf(successFunction, errorFunction, progressFunction);
```
You can encrypt or decrypt a file, providing a password:
#####Encryption
```js
smfInst.encryptFile(fileToProtect, filePass);
```
#####Decryption
```js
smfInst.decryptFile(fileToProtect, filePass);
```

To use it as a library, you can use the working example below:
```html  
<html><head>
<script type="text/javascript" src="build/securemyfiles.min.js"></script>
</head><body>
File: <input type='file' id='file'/>
Pass: <input type='text' id='pass'/>
<input type='button' value='Encrypt' onclick='encrypt()'/>
<input type='button' value='Decrypt' onclick='decrypt()'/>
<script type="text/javascript">
function success() {
  alert('Operation completed successfully')
}

var smfInst = new smf(success);

function encrypt() {
  var fileToProtect = document.getElementById('file').files[0],
    filePass = document.getElementById('pass').value;
  
  smfInst.encryptFile(fileToProtect, filePass);
}

function decrypt() {
  var fileToProtect = document.getElementById('file').files[0],
    filePass = document.getElementById('pass').value;
  
  smfInst.decryptFile(fileToProtect, filePass);
}
</script>
```

##Browser Support

SMF works with IE10+, Chrome 6+, Firefox 4+, Safari 6+, Opera 12.+
