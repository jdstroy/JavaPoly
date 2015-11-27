import * as _ from 'underscore';
import JavaClassFile from './JavaClassFile';
import JavaArchiveFile from './JavaArchiveFile';
import JavaSourceFile from './JavaSourceFile';
import JavaClassWrapper from './JavaClassWrapper';
import QueueExecutor from './QueueExecutor';
import ProxyWrapper from './ProxyWrapper';

const JAVA_MIME = [
  { // For compiled Java-class
    type: 'class',
    mime: ['application/java-vm'],
    srcRequired: true
  },
  { // For Java source files
    type: 'java',
    mime: ['text/x-java-source'],
    srcRequired: false
  },
  { // For JAR-files
    type: 'jar',
    mime: ['application/java-archive'],
    srcRequired: true
  }
];

const DEFAULT_JAVAPOLY_OPTIONS = {
  /**
   * When page is loading look for all corresponding MIME-types and create objects for Java automatically
   * @type {Boolean}
   */
  initOnStart: true,
  /**
   * Directory name that stores all class-files, jars and/or java-files
   * @type {String}
   */
  storageDir: '/tmp/data',
  /**
   * URL where we download the doppio library.
   * @type {String}
   * 1.'doppio/', download from user owner domain(${your.domain}/doppio), eg. localhost for locally test
   * 2. or a public url, eg. http://www.javapoly.com/doppio/
   */
  doppioLibUrl: 'doppio/'
  //doppioLibUrl: 'http://www.javapoly.com/doppio/'
}

/**
 * Main JavaPoly class that do all underliying job for initialization
 * Simple usage:
 * 1. Create object: (new JavaPoly());
 * 2. And catch document event 'JVMReady' where event.details contains JavaPoly object that emmitted this event
 *
 * (new JavaPoly());
 * document.addEventListener('JVMReady', function(e) {
 *   var javaPoly = e.detail;
 *   // place for your jvm code
 * });
 */
class JavaPoly {
  constructor(_options) {
    let options = _.extend(DEFAULT_JAVAPOLY_OPTIONS, _options);
    /**
     * Stores referense to the BrowserFS fs-library
     * @type {BrowserFS}
     */
    this.fs = null;

    /**
     * Stores referense to the BrowserFS path-library
     * @type {[type]}
     */
    this.path = null;

    /**
     * Stores referense to the special extension for fs (for example it contains recursive mkdir)
     * @type {[type]}
     */
    this.fsext = null;

    /**
     * Array of all registered Java classes, jars, or sources
     * @type {Array}
     */
    this.scripts = [];

    /**
     * Array of all registered Java sources.
     * @type {Array}
     */
    this.sources = [];

    /**
     * Array that contains all promises that should be resolved before JVM running.
     * This array should be used for loading script
     * @type {Array<Promise>}
     */
    this.loadingHub = [];

    /**
     * Object with options of JavaPoly
     * @type {Object}
     */
    this.options = options;

    /**
     * Array that contains classpath, include the root path of class files , jar file path.
     * @type {Array}
     */
    this.classpath = [this.options.storageDir];

    this.fs = BrowserFS.BFSRequire('fs');
    this.path = BrowserFS.BFSRequire('path');
    this.fsext = require('./tools/fsext')(this.fs, this.path);

    this.queueExecutor = new QueueExecutor().waitFor('JVMReady');
    this.initJavaPoly();

    // Init objects for user to make possible start to work with JavaPoly instantly
    this.initGlobalApiObjects();
  }

  // Will be called from queueExecutor lazily
  initJavaPoly() {
    // Initialization of BrowserFS
    let mfs = new BrowserFS.FileSystem.MountableFileSystem();

    BrowserFS.initialize(mfs);
    mfs.mount('/tmp', new BrowserFS.FileSystem.InMemory());
    mfs.mount('/home', new BrowserFS.FileSystem.LocalStorage());
    mfs.mount('/sys', new BrowserFS.FileSystem.XmlHttpRequest('listings.json', this.options.doppioLibUrl));

    this.fsext.rmkdirSync(this.options.storageDir);

    if (this.options.initOnStart === true) {
      global.document.addEventListener('DOMContentLoaded', e => {
        _.each(global.document.scripts, script => {
          let scriptTypes = JAVA_MIME.filter(item => item.mime.some(m => m === script.type));

          // Create only when scriptTypes is only 1
          if (scriptTypes.length === 1) {
            let scriptType = scriptTypes[0].type;
            if (scriptTypes[0].srcRequired && !script.src)
              throw `An attribute 'src' should be declared for MIME-type '${script.type}'`;

            switch(scriptType) {
              case 'class':
                this.scripts.push(new JavaClassFile(this, script));
                break;
              case 'java':
                let javaSource = new JavaSourceFile(this, script);
                this.scripts.push(javaSource);
                this.sources.push(javaSource);
                break;
              case 'jar':
                this.scripts.push(new JavaArchiveFile(this, script));
                break;
            }
          }
        });

        // After all call initJVM
        this.initJVM();
      }, false);
    }
  }

  /**
   * Dispatching JVMReady event to window
   */
  dispatchReadyEvent() {
    global.document.dispatchEvent(
      new CustomEvent('JVMReady', {detail: this})
    );
  }

  initGlobalApiObjects() {
    global.window.J = ProxyWrapper.createRootEntity();
    global.window.Java = {
      type: JavaClassWrapper.getClassWrapperByName
    };
  }

  /**
   * Initialize JVM for this JavaPoly:
   * 1. Ensure that all loading promises are finished
   * 2. Create object for JVM
   * 3. Dispatch event that JVM is ready
   */
  initJVM() {
    // Ensure that all promises are finished
    // and after this dispatch event JVMReady
    Promise.all(this.loadingHub).then(()=> {
      // Delete loadingHub (if somewhere else it is used so
      // it's gonna be runtime error of that usage)
      delete this.loadingHub;
      this.loadingHub = [];

      this.jvm = new doppio.JVM({
        bootstrapClasspath: ['/sys/vendor/java_home/classes'],
        classpath: this.classpath,
        javaHomePath: '/sys/vendor/java_home',
        extractionPath: '/tmp',
        nativeClasspath: ['/sys/src/natives'],
        assertionsEnabled: false
      }, (err, jvm) => {
          // Compilation of Java sorces
          let compilationHub = this.sources.map( (src) => src.compile() );

          // Dispatch event when all compilations are finished
          Promise.all(compilationHub).then(() => this.dispatchReadyEvent());
      });
    });
  }
}

export default JavaPoly;