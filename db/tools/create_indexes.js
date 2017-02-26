var path  = require('path');
var util  = require('util');
var fs    = require('fs');

function execute() {
  var regex = /.js$/i;
  var modelDir = path.resolve('.', 'api', 'models');
  var stats = fs.statSync(modelDir);

  if (!(stats && stats.isDirectory())) {
    throw new Error('Invalid model directory: ' + modelDir);
  }

  var files = fs.readdirSync(modelDir);
  for (var i = 0; i < files.length; i++) {
    var file = path.join(modelDir, files[i]);
    var stats = fs.statSync(file);
    if (stats.isFile() && file.match(regex)) {
      console.log('Process model: ' + path.basename(file, '.js'));
    }
  }

};

execute();