const doppioPath = "./node_modules/@hrj/doppiojvm-snapshot/"
const babelTransforms = [
   ["babelify", { "presets": ["es2015"], "plugins": ["transform-runtime"] }]
];

const gruntBrowserifyOptionsForNode = {
  browserifyOptions : {
    "ignoreMissing": true,
    "builtins": false,
    "bare": true,
    insertGlobalVars: {
      process: function() {
        return;
      },
    }
  },
  transform: babelTransforms
}

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    browserify: {
      "node-doppio": {
        files: { 'build/javapoly-node-doppio.js':['src/node-doppio.js'] },
        options: gruntBrowserifyOptionsForNode
      },
      "node-system": {
        files: { 'build/javapoly-node-system.js':['src/node-system.js'] },
        options: gruntBrowserifyOptionsForNode
      },
      production: {
        files:{
          'build/javapoly.js':['src/main.js'],
          'build/javapoly_worker.js':['src/webworkers/JavaPolyWorker.js']
        },
        options: {
          transform: babelTransforms
        }
      },
      development:{
        files:{
          'build/javapoly.js':['src/main.test.js'],
          'build/javapoly_worker.js':['src/webworkers/JavaPolyWorker.js']
        },
        options: {
          transform: babelTransforms,
          browserifyOptions: {
            debug: true
          }
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
        javaOptions: {
          "d": "build/classes/",
          "cp": ["build/jars/java_websocket.jar:build/jars/javax.json-1.0.4.jar", "src/jars/commons-lang3-3.5-SNAPSHOT.jar"]
        },
        sourceFiles: ['src/classes/com/javapoly/*.java', 'src/classes/com/javapoly/dom/*.java']
      },
      "compile-test": {
        command: "javac",
        javaOptions: {
          "d": "test/classes",
          "cp": "build/classes"
        },
        sourceFiles: ['test/classes/*.java']
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
      jars: {
        files: [
          {expand: true, cwd: './src/jars/', src: ['*.jar'], dest: './build/jars'}
        ]
      },
      natives: {
        files: [
          {expand: true, cwd: './src/natives/', src: ['*.js'], dest: './build/natives'}
        ]
      },
      jars: {
        files: [
          {expand: true, cwd: './src/jars/', src: ['*.jar'], dest: './build/jars'}
        ]
      },
      doppio_fastdev: {
        files: [
          {expand: true, cwd: doppioPath + '/dist/fast-dev/', src: ['**'], dest: './test/doppio'},
          {expand: true, cwd: doppioPath, src: ['package.json'], dest: './test/doppio'}
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
        from: doppioPath,
        to: './test/doppio',
        tasks: ['clean:doppio', 'copy:doppio_fastdev']
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
    mkdir: {
      build: {
        options: {
          mode: 0700,
          create: ['build/classes/com/javapoly', 'build/natives', 'build/jars']
        },
      },
    },
    listings: {
      options: {
        cwd: 'build/.',
        output: 'build/listings.json'
      },
      javapoly: {

      }
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-symlink');
  grunt.loadNpmTasks('grunt-run-java');
  grunt.loadNpmTasks('grunt-http-server');
  grunt.loadNpmTasks('grunt-mkdir');
  grunt.loadNpmTasks('grunt-babel');

  grunt.loadTasks('tasks');

  grunt.registerTask('build:java', ['mkdir:build', 'copy:jars', 'copy:natives', 'run_java:compile']);
  grunt.registerTask('build:test', ['mkdir:build', 'build:java', 'run_java:compile-test', 'compare_version', 'browserify:development', 'listings:javapoly', 'symlink:build_to_test']);
  grunt.registerTask('build', ['mkdir:build', 'build:java', 'browserify:production', 'browserify:node-doppio', 'listings:javapoly']);
  grunt.registerTask('build:node-doppio', ['mkdir:build', 'build:java', 'browserify:node-doppio']);
  grunt.registerTask('build:node-system', ['mkdir:build', 'build:java', 'browserify:node-system']);
  grunt.registerTask('build:browser', ['mkdir:build', 'build:java', 'browserify:production', 'listings:javapoly']);

  grunt.registerTask('default', ['build']);
  grunt.registerTask('dev', ['build:test', 'http-server:dev', 'watch:dev_js']);
}
