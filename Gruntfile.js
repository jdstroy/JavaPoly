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
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-symlink');

  grunt.registerTask('build:test', ['browserify:build', 'symlink:distToTests']);
  grunt.registerTask('build', ['browserify:build']);  

  grunt.registerTask('default', ['build']);
}
