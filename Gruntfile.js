module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
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
        files: 'src/**/*.js',
        tasks: ['build', 'copy:distToTests'],
        options: {
          interrupt: true,
        },
      },
    },
    symlink: {
      distToTests: {
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
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-symlink');
  grunt.loadNpmTasks('grunt-run-java');

  grunt.registerTask("sys_build", function() {
    grunt.file.mkdir("build/sys");
    grunt.file.copy("sys/libListings.json", "build/sys/libListings.json");

    // Copy sysNatives recursively
    grunt.file.mkdir("build/sysNatives");
    grunt.file.recurse("sysNatives/", function(absPath) {
      grunt.file.copy(absPath, "build/"+absPath);
    });
  });

  grunt.registerTask('build:java', ['sys_build', 'run_java:compile']);

  grunt.registerTask('build:test', ['build:java', 'browserify:buildForTest', 'symlink:distToTests']);
  grunt.registerTask('build', ['build:java', 'browserify:build']);
  grunt.registerTask('build:browser', ['build:java', 'browserify:build']);

  grunt.registerTask('default', ['build']);
}
