var fs = require('fs');
var path = require('path');
var semver = require('semver');

var isFileExists = function(name) {
  return new Promise(function(resolve, reject) {
    var stats;
    try {
      fs.lstat(name, function(err, stats) {
        if (stats && stats.isFile()) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    } catch(e) {
      resolve(false);
    }
  });
}

module.exports = function(grunt) {
  grunt.registerMultiTask('compare_version', function() {
    var DATA_FROM = this.data.from;
    var DATA_TO = this.data.to;
    var tasks = this.data.tasks;
    var done = this.async();
    isFileExists(path.join(DATA_FROM, 'package.json'))
      .then(function(fromExists) {
        if (fromExists) {
          isFileExists(path.join(DATA_TO, 'package.json'))
            .then(function(toExists) {
              var fromVersion = JSON.parse(fs.readFileSync(path.join(DATA_FROM, 'package.json'), 'utf8')).version;
              var toVersion = '0.0.0';
              if (toExists) {
                toVersion = JSON.parse(fs.readFileSync(path.join(DATA_TO, 'package.json'), 'utf8')).version;
              }
              if (semver.gt(fromVersion, toVersion)) {
                grunt.task.run(tasks);
              } else {
                grunt.log.writeln('You have the latest module.')
              }

              done();
            });
        } else {
          grunt.log.error('You don`t FROM file.')
          done();
        }        
      });    
  });
}