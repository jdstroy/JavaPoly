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
              var fromVersion = grunt.file.readJSON(path.join(DATA_FROM, 'package.json')).version;
              var toVersion = toExists ? grunt.file.readJSON(path.join(DATA_TO, 'package.json')).version : '0.0.0';

              if (semver.neq(fromVersion, toVersion)) {
                grunt.task.run(tasks);
              }

              done();
            });
        } else {
          grunt.log.error('You don`t have FROM file.')
          done();
        }        
      });    
  });
}