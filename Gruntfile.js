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
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    browserify: {
      production: {
        src: ['src/**/main.js'],
        dest: 'build/javapoly.js',
        options: {
          transform: [
             ["babelify", { "presets": ["es2015"] }]
          ]
        }
      },
      development:{
      	src: ['src/**/main.test.js'],
        dest: 'build/javapoly.js',
        options: {
          transform: [
             ["babelify", { "presets": ["es2015"] }]
          ]
        }
      }
    },
    watch: {
      scripts: {
        files: 'src/**/*.js',
        tasks: ['build', 'copy:distToTests'],
        options: {
          interrupt: true,
        },
      },
    },
    symlink: {
      build_to_test: {
        src: './build',
        dest: './test/build'
      }
    },
    run_java: {
      options: {
        stdout: false,
        stderr: true,
        stdin: false,
        failOnError: true
      },
      compile: {
        command: "javac",
        javaOptions: { //javac Options
          "d": "build/sys/"
        },
        sourceFiles: ["sys/**/*.java"]
      }
    },
    clean: {
      doppio: {
        src: ['./test/doppio']
      }
    },
    copy: {
      doppio_release: {
        files: [
          {expand: true, cwd: './node_modules/doppiojvm/dist/release/', src: ['*'], dest: './test/doppio'},
          {expand: true, cwd: './node_modules/doppiojvm/', src: ['package.json'], dest: './test/doppio'}
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-symlink');
  grunt.loadNpmTasks('grunt-run-java');

  grunt.registerTask('sys_build', function() {
    grunt.file.mkdir('build/sys');
    grunt.file.copy('sys/libListings.json', 'build/sys/libListings.json');

    // Copy sysNatives recursively
    grunt.file.mkdir('build/sysNatives');
    grunt.file.recurse('sysNatives/', function(absPath) {
      grunt.file.copy(absPath, 'build/'+absPath);
    });
  });

  grunt.registerTask('doppio:release_copy', function() {
    var DOPPIO_FROM = './node_modules/doppiojvm';
    var DOPPIO_TO = './test/doppio';
    var done = this.async();
    isFileExists(path.join(DOPPIO_FROM, 'package.json'))
      .then(function(doppioExists) {
        if (doppioExists) {
          isFileExists(path.join(DOPPIO_TO, 'package.json'))
            .then(function(doppioTestExists) {
              var doppioVersion = JSON.parse(fs.readFileSync(path.join(DOPPIO_FROM, 'package.json'), 'utf8')).version;
              var doppioTestVersion = '0.0.0';
              if (doppioTestExists) {
                doppioTestVersion = JSON.parse(fs.readFileSync(path.join(DOPPIO_TO, 'package.json'), 'utf8')).version;
              }
              if (semver.gt(doppioVersion, doppioTestVersion)) {
                grunt.task.run('clean:doppio');
                grunt.task.run('copy:doppio_release');
              } else {
                grunt.log.writeln('You have the latest doppiojvm in your test directory.')
              }

              done();
            });
        } else {
          grunt.log.error('You don`t have doppiojvm distr. Run command "npm install".')
          done();
        }        
      });    
  });

  grunt.registerTask('build:java', ['sys_build', 'run_java:compile']);

  grunt.registerTask('build:test', ['build:java', 'browserify:development', 'symlink:build_to_test']);
  grunt.registerTask('build', ['build:java', 'browserify:production']);
  grunt.registerTask('build:browser', ['build:java', 'browserify:production']);

  grunt.registerTask('default', ['build']);
}
