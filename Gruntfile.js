var path = require('path');

const doppioPath = "./node_modules/@hrj/doppiojvm-snapshot/";

const babelTransforms = [
    ["babelify", {"presets": ["es2015"], "plugins": ["transform-runtime"]}]
];

const babelNativeTransforms = [
    ["babelify", {"presets": ["es2015"]}]
];

const gruntBrowserifyOptionsForNode = {
    browserifyOptions: {
        "ignoreMissing": true,
        "builtins": false,
        "bare": true,
        insertGlobalVars: {
            process: function () {
            }
        }
    },
    transform: babelTransforms
};

module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        browserify: {
            "node-doppio": {
                files: {'build/javapoly-node-doppio.js': ['src/node-doppio.js']},
                options: gruntBrowserifyOptionsForNode
            },
            "node-system": {
                files: {'build/javapoly-node-system.js': ['src/node-system.js']},
                options: gruntBrowserifyOptionsForNode
            },
            natives: {
                files: {
                  'build/natives/DoppioBridge.js': ['src/natives/DoppioBridge.js'],
                  'build/natives/XHRConnection.js': ['src/natives/XHRConnection.js']
                },
                options: {
                    transform: babelNativeTransforms
                }
            },
            production: {
                files: {
                    'build/javapoly.js': ['src/main.js'],
                    'build/javapoly_worker.js': ['src/webworkers/JavaPolyWorker.js']
                },
                options: {
                    transform: babelTransforms
                }
            },
            development: {
                files: {
                    'build/javapoly.js': ['src/main.test.js'],
                    'build/javapoly_worker.js': ['src/webworkers/JavaPolyWorker.js']
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
                    interrupt: true
                }
            }
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
                    "cp": ["build/jars/java_websocket.jar:build/jars/javax.json-1.0.4.jar"]
                },
                sourceFiles: [
                    'src/classes/com/javapoly/*.java',
                    'src/classes/com/javapoly/reflect/*.java',
                    'src/classes/com/javapoly/dom/*.java',
                    'src/classes/com/javapoly/invoke/*.java',
                    'src/classes/com/javapoly/invoke/internal/*.java'
                ]
            },
            "compile-test": {
                command: "javac",
                javaOptions: {
                    "d": "test/classes",
                    "cp": "build/classes"
                },
                sourceFiles: ['test/classes/**.java', 'test/classes/com/javapoly/test/*.java']
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
            },
            package: {
                files: [
                    {expand: true, cwd: './build/', src: ['**'], dest: './package'},
                    {expand: true, cwd: './tasks/package', src: ['README.md'], dest: './package'}
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
                showDir: true,
                autoIndex: true,
                runInBackground: true,
                port: 8080,
                root: 'test/.'
            },
            test: {
                showDir: true,
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
                }
            },
            package: {
                options: {
                    mode: 0700,
                    create: ['package']
                }
            }
        },
        listings: {
            options: {
                cwd: 'build/.',
                output: 'build/listings.json'
            },
            javapoly: {}
        },
        nodemon: {
          dev: {
            script: 'server.js',
            options: {
              cwd: path.join(__dirname, 'test')
            }
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
    grunt.loadNpmTasks('grunt-newer');
    grunt.loadNpmTasks('grunt-nodemon');

    grunt.loadTasks('tasks');

    grunt.registerTask('build:java', ['mkdir:build', 'copy:jars', 'newer:browserify:natives', 'run_java:compile']);
    grunt.registerTask('build:test', ['mkdir:build', 'build:java', 'run_java:compile-test', 'compare_version', 'browserify:development', 'listings:javapoly', 'symlink:build_to_test']);
    grunt.registerTask('build', ['mkdir:build', 'build:java', 'newer:browserify:production', 'newer:browserify:node-doppio', 'listings:javapoly']);
    grunt.registerTask('build:node-doppio', ['mkdir:build', 'build:java', 'run_java:compile-test', 'newer:browserify:node-doppio']);
    grunt.registerTask('build:node-system', ['mkdir:build', 'build:java', 'run_java:compile-test', 'newer:browserify:node-system']);
    grunt.registerTask('build:browser', ['mkdir:build', 'build:java', 'newer:browserify:production', 'listings:javapoly']);

    grunt.registerTask('default', ['build']);
    grunt.registerTask('dev', ['build:test', 'nodemon:dev', 'watch:dev_js']);

    grunt.registerTask('package:prepare', 'A sample task that logs stuff.', function () {
        var packageJson = grunt.file.readJSON('./tasks/package/package.json');
        var now = new Date();
        var padLeftTwo = function (val) {
            var result = val.toString();
            if (result.length === 1) {
                result = '0' + result;
            }
            return result;
        };
        var version = '0.0.' + now.getFullYear() + padLeftTwo(now.getMonth() + 1) + padLeftTwo(now.getDate())
            + padLeftTwo(now.getHours()) + padLeftTwo(now.getMinutes()) + padLeftTwo(now.getSeconds());
        packageJson.version = version;
        grunt.file.write('./package/package.json', JSON.stringify(packageJson, null, '\t'));
        grunt.log.writeln('%s: created package.json, build version: %s', this.name, version);
    });
    grunt.registerTask('build:package', 'Creating complete package', ['build', 'mkdir:package', 'copy:package', 'package:prepare']);
};
