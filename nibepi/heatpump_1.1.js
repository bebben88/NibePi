var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var http = require('https');
var fs = require('fs');

var download = function(url, dest, cb) {
  exec(`sudo mount -o remount,rw`, function(error, stdout, stderr) {
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
  });
  
};
download("https://raw.githubusercontent.com/bebben88/NibePi/master/update/upgrade.js",`${__dirname}/upgrade.js`, function(result) {
  if(result===undefined) {
    exec(`sudo chown pi:pi ${__dirname}/upgrade.js`, function(error, stdout, stderr) {
      download("https://raw.githubusercontent.com/bebben88/NibePi/master/update/upgrade_nodered.sh","/tmp/upgrade_nodered.sh", function(result) {
  if(result===undefined) {
    exec(`sudo chown pi:pi /tmp/upgrade_nodered.sh && chmod u+x /tmp/upgrade_nodered.sh`, function(error, stdout, stderr) {
      download("https://raw.githubusercontent.com/bebben88/NibePi/master/update/upgrade_nibepi.sh",`/tmp/upgrade_nibepi.sh`, function(result) {
        if(result===undefined) {
          exec(`sudo chown pi:pi /tmp/upgrade_nibepi.sh && chmod u+x /tmp/upgrade_nibepi.sh`, function(error, stdout, stderr) {
            const child = spawn('node', [`${__dirname}/upgrade.js`], {
              detached: true,
              stdio: 'inherit'
            });
            //child.unref();
          });
        }
      });
    });
  }
})
  });
  }
})
