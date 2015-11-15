import * as _ from 'underscore';
import JavaClassFile from './JavaClassFile';
import JavaArchiveFile from './JavaClassFile';
import JavaSourceFile from './JavaSourceFile';
import createRootEntity from './JavaEntity.js';

const JAVA_MIME = [
  { // for compiled Java-class
    type: 'class',
    mime: ['application/java-vm'],
    srcRequired: true
  },
  { // for Java source files
    type: 'java',
    mime: ['text/x-java-source'],
    srcRequired: false
  },
  { // for JAR-files
    type: 'jar',
    mime: ['application/java-archive'],
    srcRequired: true
  }
];

const DEFAULT_JAVAPOLY_OPTIONS = {
  // when page is loading look for all corresponding MIME-types and create objects for Java automatically
  initOnStart: true
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
     * Store referense to the BrowserFS object
     * @type {BrowserFS}
     */
    this.fs = null;

    /**
     * Array of all registered Java classes, jars, or sources
     * @type {Array}
     */
    this.scripts = [];

    /**
     * Array that contains all promises that should be resolved before JVM running.
     * This array should be used for loading script
     * @type {Array}
     */
    this.loadingHub = [];

    /**
     * Directory name that stores all class-files, jars and/or java-files
     * @type {String}
     */
    this.storageDir = '/tmp/data/';

    /**
     * [java description]
     * @type {[type]}
     */
    this.java = null;

    // initialization of BrowserFS
    let mfs = new BrowserFS.FileSystem.MountableFileSystem();
    this.fs = BrowserFS.BFSRequire('fs');
    BrowserFS.initialize(mfs);
    mfs.mount('/tmp', new BrowserFS.FileSystem.InMemory());
    mfs.mount('/home', new BrowserFS.FileSystem.LocalStorage());
    mfs.mount('/sys', new BrowserFS.FileSystem.XmlHttpRequest('listings.json', 'doppio/'));

    this.fs.mkdirSync(this.storageDir);

    if (options.initOnStart === true) {
      global.document.addEventListener('DOMContentLoaded', e => {
        _.each(global.document.scripts, script => {
          let scriptTypes = JAVA_MIME.filter(item => item.mime.some(m => m === script.type));

          // create only when scriptTypes is only 1
          if (scriptTypes.length === 1) {
            let scriptType = scriptTypes[0].type;
            if (scriptTypes[0].srcRequired && !script.src)
              throw `An attribute 'src' should be declared for MIME-type '${script.type}'`;

            switch(scriptType) {
              case 'class':
                this.scripts.push(new JavaClassFile(this, script));
                break;
              case 'java':
                this.scripts.push(new JavaSourceFile(this, script));
                break;
              case 'jar':
                this.scripts.push(new JavaArchiveFile(this, script));
                break;
            }
          }
        });

        // after all call initJVM
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

  initRootEntity() {
    this.J = createRootEntity(this);
  }

  /**
   * Initialize JVM for this JavaPoly:
   * 1. Ensure that all loading promises are finished
   * 2. Create object for JVM
   * 3. Dispatch event that JVM is ready
   */
  initJVM() {
    // ensure that all promises are finished and
    // after this dispatch event JVMReady
    Promise.all(this.loadingHub).then(()=> {
      // delete loadingHub (if somewhere else it is used so it's gonna be runtime error of that using)
      delete this.loadingHub;
      this.loadingHub = [];

      this.jvm = new doppio.JVM(
        {
          bootstrapClasspath: ['/sys/vendor/java_home/classes'],
          classpath: [this.storageDir],
          javaHomePath: '/sys/vendor/java_home',
          extractionPath: '/tmp',
          nativeClasspath: ['/sys/src/natives'],
          assertionsEnabled: false
        }, (err, jvm) => {
          this.initRootEntity();
          this.dispatchReadyEvent();
        }
      );

    });
  }
}

export default JavaPoly;