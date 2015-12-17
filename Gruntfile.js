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
      dev_js: {
        files: 'src/**/*.js',
        tasks: ['browserify:development', 'symlink:build_to_test'],
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
      },
      browserfs: {
        src: ['./test/browserfs']
      }
    },
    copy: {
      sys: {
        files: [
          {expand: true, cwd: './sys/', src: ['libListings.json'], dest: './build/sys/'},
          {expand: true, cwd: './sysNatives/', src: ['**'], dest: './build/sysNatives/'}
        ]
      },
      doppio_release: {
        files: [
          {expand: true, cwd: './node_modules/doppiojvm/dist/fast-dev/', src: ['**'], dest: './test/doppio'},
          {expand: true, cwd: './node_modules/doppiojvm/', src: ['package.json'], dest: './test/doppio'}
        ]
      },
      browserfs: {
        files: [
          {expand: true, cwd: './node_modules/browserfs/dist/', src: ['**'], dest: './test/browserfs'},
          {expand: true, cwd: './node_modules/browserfs/', src: ['package.json'], dest: './test/browserfs'}
        ]        
      }
    },
    compare_version: {
      doppio: {
        from: './node_modules/doppiojvm',
        to: './test/doppio',
        tasks: ['clean:doppio', 'copy:doppio_release']
      },
      browserfs: {
        from: './node_modules/browserfs',
        to: './test/browserfs',
        tasks: ['clean:browserfs', 'copy:browserfs']
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
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-symlink');
  grunt.loadNpmTasks('grunt-run-java');
  grunt.loadNpmTasks('grunt-http-server');

  grunt.loadTasks('tasks');

  grunt.registerTask('build:java', ['copy:sys', 'run_java:compile']);
  grunt.registerTask('build:test', ['build:java', 'compare_version', 'browserify:development', 'symlink:build_to_test']);
  grunt.registerTask('build', ['build:java', 'browserify:production']);
  grunt.registerTask('build:browser', ['build:java', 'browserify:production']);

  grunt.registerTask('default', ['build']);
  grunt.registerTask('dev', ['build:test', 'http-server:dev', 'watch:dev_js']);
}
