import JavaClassFile from './../mime/JavaClassFile';
import JavaArchiveFile from './../mime/JavaArchiveFile';
import JavaSourceFile from './../mime/JavaSourceFile';

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

/**
 * The JavaPolyLoader load the jvm and do the basic init of javapoly.
 * can be run both in Browser or WebWorker
 *
 * The JavaPoly loader will do the following step
 *  1. init the browserFS of JavaPoly,
 *  2. load java mime scripts
 *  3. start jvm
 *
 * @param javapoly
 *  the javapoly instance to loader
 * @param scripts
 *  the scripts {src, type} include the java mime script to load,
 *  we will only load the script in JAVA_MIME.
 */
class JavaPolyLoader {
  constructor(javapoly, scripts) {

    this.javapoly = javapoly;

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
    this.options = this.javapoly.options;

    /**
     * Array that contains classpath, include the root path of class files , jar file path.
     * @type {Array}
     */
    this.classpath = [this.options.storageDir];

    this.initBrowserFS();
    this.loadScripts(scripts);
    this.initJVM();
  }

  loadScripts(scripts) {
    // Load java mime files
    for(const script of scripts) {
      const scriptTypes = JAVA_MIME.filter(item => item.mime.some(m => m === script.type));
      // Create only when scriptTypes is only 1
      if (scriptTypes.length === 1) {
        const scriptType = scriptTypes[0].type;

        if (scriptTypes[0].srcRequired && !script.src) {
          throw `An attribute 'src' should be declared for MIME-type '${script.type}'`;
        }

        switch(scriptType) {
          case 'class':
            this.scripts.push(new JavaClassFile(this, script));
            break;
          case 'java':
            const javaSource = new JavaSourceFile(this, script);
            this.scripts.push(javaSource);
            this.sources.push(javaSource);
            break;
          case 'jar':
            this.scripts.push(new JavaArchiveFile(this, script));
            break;
        }
      }
    };

    // Compilation of Java sources
    this.sources.forEach( (src) => src.compile() );
  }

  /**
   * Initialization of BrowserFS
   */
  initBrowserFS(){
    const mfs = new BrowserFS.FileSystem.MountableFileSystem();
    BrowserFS.initialize(mfs);
    mfs.mount('/tmp', new BrowserFS.FileSystem.InMemory());

    // FIXME local storage can't be used in WebWorker, check if it affect anything.
    if (!window.isJavaPolyWorker) {
      mfs.mount('/home', new BrowserFS.FileSystem.LocalStorage());
    }

    mfs.mount('/sys', new BrowserFS.FileSystem.XmlHttpRequest('listings.json', this.options.doppioLibUrl));
    mfs.mount('/javapoly', new BrowserFS.FileSystem.XmlHttpRequest('listings.json', this.options.javaPolyBaseUrl));

    this.fs = BrowserFS.BFSRequire('fs');
    this.path = BrowserFS.BFSRequire('path');
    this.fsext = require('./../tools/fsext')(this.fs, this.path);
    this.fsext.rmkdirSync(this.options.storageDir);

    // NOTES, we may also want to use fs in other place of javapoly
    this.javapoly.fs = this.fs;
  }

  /**
   * Return a promise that JVM will be initialised for this JavaPoly:
   * 1. Ensure that all loading promises are finished
   * 2. Create object for JVM
   */
  initJVM() {
    Promise.all(this.loadingHub).then(()=> {
      // Delete loadingHub (if somewhere else it is used so it's gonna be runtime error of that usage)
      delete this.loadingHub;
      this.loadingHub = [];

      this.javapoly.jvm = new Doppio.VM.JVM({
        doppioHomePath: this.options.doppioLibUrl,
        bootstrapClasspath: ['/sys/vendor/java_home/lib/rt.jar', "/javapoly/classes"],
        classpath: this.classpath,
        javaHomePath: '/sys/vendor/java_home',
        extractionPath: '/tmp',
        nativeClasspath: ['/sys/natives', "/javapoly/natives"],
        assertionsEnabled: true
      }, (err, jvm) => {
        if (err) {
          console.log('err loading JVM:', err);
        } else {
          jvm.runClass('com.javapoly.Main', [], function(exitCode) {
            // Control flow shouldn't reach here under normal circumstances,
            // because Main thread keeps polling for messages.
            console.log("JVM Exit code: ", exitCode);
          });
        }
      });
    });
  }
}

export default JavaPolyLoader;
