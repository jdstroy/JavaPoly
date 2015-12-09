module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    notify_hooks: {
      options: {
        enabled: true,
        max_jshint_notifications: 5, // maximum number of notifications from jshint output
        title: "JavaPoly Building", // defaults to the name in package.json, or will use project directory's name
        success: true, // whether successful grunt executions should be notified automatically
        duration: 3 // the duration of notification in seconds, for `notify-send only
      }
    },
    browserify: {
      build: {
        src: ['src/**/main.js'],
        dest: 'build/javapoly.js',
        options: {
          transform: [
             ["babelify", { "presets": ["es2015"] }]
          ]
        }
      },
      buildForTest:{
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
        files: ['src/**/*.js', '!src/natives/**/*.js'],
        tasks: ['build', 'symlink:buildToTest', 'notify_hooks'],
        options: {
          interrupt: true,
        },
      },
      javasrc: {
        files: 'classes/**/*.java',
        tasks: ['run_java:compile']
      }
    },
    symlink: {
      buildToTest: {
        src: './build',
        dest: './test/build'
      },
      nativesToBuild: {
        src: './src/natives',
        dest: './build/natives'
      },
      classesToBuild: {
        src: './classes',
        dest: './build/classes'
      }
    },
    listings: {
      options: {
        cwd: 'build/.',
        output: 'build/listings.json'
      },
      javapoly: {

      }
    },
    'http-server': {
      dev: {
        showDir : true,
        autoIndex: true,
        runInBackground: true,
        port: 8080,
        root: 'test/.'
      },
      test: {
        showDir : true,
        autoIndex: true,
        runInBackground: false,
        port: 8080,    
        root: 'test/.'
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
        sourceFiles: ["classes/com/javapoly/Executor.java"]
      }
    }

  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-symlink');
  grunt.loadNpmTasks('grunt-notify');
  grunt.loadNpmTasks('grunt-http-server');
  grunt.loadNpmTasks('grunt-run-java');

  grunt.loadTasks('tasks');  

  grunt.registerTask('build:test', ['browserify:buildForTest', 'symlink:buildToTest']);
  grunt.registerTask('build', ['browserify:build', 'symlink:nativesToBuild', 'symlink:classesToBuild', 'listings:javapoly']); 
  grunt.registerTask('build:browser', ['browserify:build']);

  grunt.registerTask('test', ['http-server:test']);
  grunt.registerTask('dev', ['http-server:dev', 'watch']);

  grunt.registerTask('default', ['build']);
}
