var spawn = require('child_process').spawn;
var http = require('https');
var fs = require('fs');

var download = function(url, dest, cb) {
  var file = fs.createWriteStream(dest);
  var request = http.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close(cb);  // close() is async, call cb after close completes.
    });
  }).on('error', function(err) { // Handle errors
    fs.unlink(dest); // Delete the file async. (But we don't check the result)
    if (cb) cb(err.message);
  });
};
download("https://raw.githubusercontent.com/anerdins/nibepi-flow/master/update/upgrade_test.js","/tmp/upgrade.js", function(result) {
  if(result!==undefined) {
    download("https://raw.githubusercontent.com/anerdins/nibepi-flow/master/update/upgrade_test.sh","/tmp/upgrade.sh", function(result) {
  if(result!==undefined) {
    const child = spawn('node', ['/tmp/upgrade.js'], {
      env: { data: "Hello" },
      detached: true,
      stdio: 'inherit'
    });
    //child.unref();
  }
})
  }
})
