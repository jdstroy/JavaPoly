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

  /**
   * Optional: javaPolyBaseUrl
   * When defined, this is used as the base URL for loading JavaPoly data such as system classes and native functions.
   * If empty, JavaPoly will try to automatically figure it out during initialisation.
   */
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

    if (!this.options.javaPolyBaseUrl) {
      this.options.javaPolyBaseUrl = this.getScriptBase();
    }

    let jvmReadyPromise = this.initJavaPoly();

    this.queueExecutor = new QueueExecutor(jvmReadyPromise);

    // Init objects for user to make possible start to work with JavaPoly instantly
    this.initGlobalApiObjects();
  }

  // returns a promise that jvm will be ready to execute
  initJavaPoly() {
    if (this.options.initOnStart === true) {
      return new Promise((resolve) => { this.beginLoading(resolve)});
    } else {
      return Promise.reject("not initialised");
    }
  }

  beginLoading(resolveJVMReady) {
    global.document.addEventListener('DOMContentLoaded', e => {
      // Ensure we have loaded the browserfs.js file before handling Java/class file
      this.loadExternalJs(this.options.doppioLibUrl+'vendor/browserfs/dist/browserfs.min.js').then(()=> {
        this.initBrowserFS();
        // Load doppio.js file
        this.loadingHub.push(this.loadExternalJs(this.options.doppioLibUrl+'doppio.js'));

        this.loadScripts();

        this.initJVM().then(resolveJVMReady);
      });
    }, false);
  }

  loadScripts() {
    // Load java mime files
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
  }

  /* This should be called outside of Promise, or any such async call */
  getScriptBase() {
    var scriptSrc = this.getScriptSrc();
    return scriptSrc.slice(0, scriptSrc.lastIndexOf("/") + 1);
  }

  getScriptSrc() {
    if (document.currentScript) {
      return document.currentScript.src;
    } else {
      var scripts = document.getElementsByTagName('script'),
          script = scripts[scripts.length - 1];

      if (script.getAttribute.length !== undefined) {
        return script.src
      }

      return script.getAttribute('src', -1)
    }
  }

  /**
   * Initialization of BrowserFS
   */
  initBrowserFS(){
    let mfs = new BrowserFS.FileSystem.MountableFileSystem();
    BrowserFS.initialize(mfs);
    mfs.mount('/tmp', new BrowserFS.FileSystem.InMemory());
    mfs.mount('/home', new BrowserFS.FileSystem.LocalStorage());
    mfs.mount('/sys', new BrowserFS.FileSystem.XmlHttpRequest('listings.json', this.options.doppioLibUrl));
    mfs.mount('/polynatives', new BrowserFS.FileSystem.XmlHttpRequest('polylistings.json', "natives/"));
    mfs.mount('/javapolySys', new BrowserFS.FileSystem.XmlHttpRequest('libListings.json', this.options.javaPolyBaseUrl + "/sys/"));
    mfs.mount('/javapolySysNatives', new BrowserFS.FileSystem.XmlHttpRequest('libListings.json', this.options.javaPolyBaseUrl + "/sysNatives/"));


    this.fs = BrowserFS.BFSRequire('fs');
    this.path = BrowserFS.BFSRequire('path');
    this.fsext = require('./tools/fsext')(this.fs, this.path);
    this.fsext.rmkdirSync(this.options.storageDir);
  }

  /**
   * load js library file.
   * @param fileSrc
   * 		the uri src of the file
   * @return Promise
   * 		we could use Promise to wait for js loaded finished.
   */
  loadExternalJs(fileSrc){
  	return new Promise((resolve, reject) => {
    	let jsElm = global.document.createElement("script");
    	jsElm.type = "text/javascript";

    	if(jsElm.readyState){
    		jsElm.onreadystatechange = function(){
    			if (jsElm.readyState=="loaded" || jsElm.readyState=="complete"){
    				jsElm.onreadysteatechange=null;
    				resolve();
    			}
    		}
    	}else{
    		jsElm.onload=function(){
    			resolve();
    			// FIXME reject when timeout
    		}
    	}

    	jsElm.src = fileSrc;
    	global.document.getElementsByTagName("head")[0].appendChild(jsElm);
  	});
  };

  initGlobalApiObjects() {
    if (typeof Proxy === 'undefined') {
      console.warn('Your browser does not support Proxy, so J.java.lang.Integer.compare(42, 41) api is not available!');
    } else {
      global.window.J = ProxyWrapper.createRootEntity();
    }
    global.window.Java = {
      type: JavaClassWrapper.getClassWrapperByName
    };
  }

  initDispatcher() {
    window.javaPolyIds = {};
    window.javaPolyData = {};
    window.javaPolyIdCount = 0;
  }

  /**
   * Return a promise that JVM will be initialised for this JavaPoly:
   * 1. Ensure that all loading promises are finished
   * 2. Create object for JVM
   */
  initJVM() {
    this.initDispatcher();

    return new Promise((resolve) => {

      Promise.all(this.loadingHub).then(()=> {
        // Delete loadingHub (if somewhere else it is used so it's gonna be runtime error of that usage)
        delete this.loadingHub;
        this.loadingHub = [];

        this.jvm = new Doppio.VM.JVM({
          bootstrapClasspath: ['/sys/vendor/java_home/classes', "/javapolySys"],
          classpath: this.classpath,
          javaHomePath: '/sys/vendor/java_home',
          extractionPath: '/tmp',
          nativeClasspath: ['/sys/natives', '/polynatives', "/javapolySysNatives"],
          assertionsEnabled: true
        }, (err, jvm) => {
          if (err) {
            console.log("err loading JVM:", err);
          } else {
            var self = this
            window.javaPolyInitialisedCallback = function() {
              // Compilation of Java sorces
              const compilationHub = self.sources.map( (src) => src.compile() );
              Promise.all(compilationHub).then(resolve);
            }

            jvm.runClass('javapoly.Main', [], function(exitCode) {
              // Control flow shouldn't reach here under normal circumstances,
              // because Main thread keeps polling for messages.
              console.log("JVM Exit code: ", exitCode);
            });

          }
        });
      });
    });
  }
}

export default JavaPoly;
