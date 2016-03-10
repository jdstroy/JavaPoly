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
        "standalone": "JavaPoly",
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
            },
            build: {
                src: ['./build/*']
            },
            package: {
                src: ['./package/*']
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
                    {expand: true, cwd: './tasks/package', src: ['README.md', 'index.js'], dest: './package'}
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
                    mode: 0o700,
                    create: ['build/classes/com/javapoly', 'build/natives', 'build/jars']
                }
            },
            package: {
                options: {
                    mode: 0o700,
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
        babel: {
            options: {
                presets: ['es2015']
            },
            dist: {
                files: {
                    'build/javapoly-node-system-raw.js': 'src/node-system.js',
                    'build/core/JavaPolyNodeSystem.js': 'src/core/JavaPolyNodeSystem.js',
                    'build/core/JavaPolyBase.js': 'src/core/JavaPolyBase.js',
                    'build/core/ProxyWrapper.js': 'src/core/ProxyWrapper.js',
                    'build/core/JavaClassWrapper.js': 'src/core/JavaClassWrapper.js',
                    'build/core/Wrapper.js': 'src/core/Wrapper.js',
                    'build/core/WrapperUtil.js': 'src/core/WrapperUtil.js',
                    'build/core/CommonUtils.js': 'src/core/CommonUtils.js',
                    'build/core/JavaObjectWrapper.js': 'src/core/JavaObjectWrapper.js',
                    'build/dispatcher/NodeSystemDispatcher.js': 'src/dispatcher/NodeSystemDispatcher.js',
                    'build/dispatcher/CommonDispatcher.js': 'src/dispatcher/CommonDispatcher.js',
                    'build/jvmManager/NodeSystemManager.js': 'src/jvmManager/NodeSystemManager.js',

                    'build/javapoly-browser.js': 'src/main.js',
                    'build/core/JavaPoly.js': 'src/core/JavaPoly.js',
                    'build/dispatcher/BrowserDispatcher.js': 'src/dispatcher/BrowserDispatcher.js',
                    'build/jvmManager/DoppioManager.js': 'src/jvmManager/DoppioManager.js',
                    'build/tools/classfile.js': 'src/tools/classfile.js',
                    'build/tools/fsext.js': 'src/tools/fsext.js',
                    'build/dispatcher/WorkerCallBackDispatcher.js': 'src/dispatcher/WorkerCallBackDispatcher.js',

                    'build/javapoly-node-doppio-raw.js': 'src/node-doppio.js',
                    'build/core/JavaPolyNodeDoppio.js': 'src/core/JavaPolyNodeDoppio.js',
                    'build/dispatcher/NodeDoppioDispatcher.js': 'src/dispatcher/NodeDoppioDispatcher.js',
                    'build/jvmManager/NodeDoppioManager.js': 'src/jvmManager/NodeDoppioManager.js',
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

    grunt.loadTasks('tasks');

    grunt.registerTask('build:java', ['mkdir:build', 'copy:jars', 'newer:browserify:natives', 'run_java:compile']);
    grunt.registerTask('build:test', ['mkdir:build', 'build:java', 'run_java:compile-test', 'compare_version', 'newer:browserify:development', 'listings:javapoly', 'symlink:build_to_test']);
    grunt.registerTask('build', ['mkdir:build', 'build:java', 'newer:browserify:production', 'newer:browserify:node-doppio', 'listings:javapoly']);
    grunt.registerTask('build:node-doppio', ['mkdir:build', 'build:java', 'run_java:compile-test', 'newer:browserify:node-doppio']);
    grunt.registerTask('build:node-system', ['mkdir:build', 'build:java', 'run_java:compile-test', 'newer:browserify:node-system']);
    grunt.registerTask('build:browser', ['mkdir:build', 'build:java', 'newer:browserify:production', 'listings:javapoly']);

    grunt.registerTask('default', ['build']);
    grunt.registerTask('dev', ['build:test', 'http-server:dev', 'watch:dev_js']);

    grunt.registerTask('package:prepare', 'A sample task that logs stuff.', function () {
        var packageJson = grunt.file.readJSON('./tasks/package/package.json');
        var now = new Date();
        var padLeftTwo = (val) => (val < 10) ? ('0' + val.toString()) : val.toString();
        var version = '0.0.' + now.getFullYear() + padLeftTwo(now.getMonth() + 1) + padLeftTwo(now.getDate())
            + padLeftTwo(now.getHours()) + padLeftTwo(now.getMinutes()) + padLeftTwo(now.getSeconds());
        packageJson.version = version;
        grunt.file.write('./package/package.json', JSON.stringify(packageJson, null, '\t'));
        grunt.log.writeln('%s: created package.json, build version: %s', this.name, version);
    });
    grunt.registerTask('build:package', 'Creating complete package', ['clean:build', 'build:java', 'newer:browserify:production',
        'babel', 'listings:javapoly', 'mkdir:package', 'clean:package', 'copy:package', 'package:prepare']);
};
