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
      },
      browserfs: {
        src: ['./test/browserfs']
      }
    },
    copy: {
      doppio_release: {
        files: [
          {expand: true, cwd: './node_modules/doppiojvm/dist/release/', src: ['*'], dest: './test/doppio'},
          {expand: true, cwd: './node_modules/doppiojvm/', src: ['package.json'], dest: './test/doppio'}
        ]
      },
      browserfs: {
        files: [
          {expand: true, cwd: './node_modules/browserfs/dist/', src: ['*'], dest: './test/browserfs'},
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
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-symlink');
  grunt.loadNpmTasks('grunt-run-java');

  grunt.loadTasks('tasks');

  grunt.registerTask('sys_build', function() {
    grunt.file.mkdir('build/sys');
    grunt.file.copy('sys/libListings.json', 'build/sys/libListings.json');

    // Copy sysNatives recursively
    grunt.file.mkdir('build/sysNatives');
    grunt.file.recurse('sysNatives/', function(absPath) {
      grunt.file.copy(absPath, 'build/'+absPath);
    });
  });

  grunt.registerTask('build:java', ['sys_build', 'run_java:compile']);

  grunt.registerTask('build:test', ['build:java', 'browserify:development', 'symlink:build_to_test']);
  grunt.registerTask('build', ['build:java', 'browserify:production']);
  grunt.registerTask('build:browser', ['build:java', 'browserify:production']);

  grunt.registerTask('default', ['build']);
}
