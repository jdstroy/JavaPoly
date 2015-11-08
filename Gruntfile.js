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
    copy: {
      distToTests: {
        files: [
          {expand: true, src: ['build/*'], dest: 'tests/', filter: 'isFile'}
        ]
      },
    },
    watch: {
      scripts: {
        files: 'src/**/*.js',
        tasks: ['build', 'copy:distToTests'],
        options: {
          interrupt: true,
        },
      },
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('build:test', ['browserify:build', 'copy:distToTests']);
  grunt.registerTask('build', ['browserify:build']);  

  grunt.registerTask('default', ['build']);
}
