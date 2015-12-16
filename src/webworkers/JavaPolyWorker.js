import * as _ from 'underscore';
import JavaPolyLoader from '../JavaPolyLoader';

class JavaPolyWorker {
  constructor(options) {
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

    // NOTES, hack global window variable used in doppio, javapoly.
    global.window = global.self;

    // load browserfs.min.js and doppio.js
    importScripts(this.options.doppioLibUrl+'vendor/browserfs/dist/browserfs.min.js');
    importScripts(this.options.doppioLibUrl+'doppio.js');
  }

  /**
   * init the jvm and load library in web workers
   */
  init(javaMimeScripts, cb) {
    this.initDispatcher();
    new JavaPolyLoader(this, javaMimeScripts, null, () => cb(true));
  }

  initDispatcher() {
    window.javaPolyMessageTypes = {};
    window.javaPolyCallbacks = {};
    window.javaPolyData = {};
    window.javaPolyIdCount = 0;

    window.isJavaPolyWorker = true;
  }
}

self.addEventListener('message', function(e) {
  if (!e.data || !e.data.javapoly)//invalid command, ignore 
    return;
  let data = e.data.javapoly; 

  switch (data.messgeType) {
  // NOTES, we need some options,Java MIME script path info from browser main thread.
  // so here we add a JVM_INIT command.
    case 'JVM_INIT':
      self.removeEventListener('message', this);
      self.javaPolyWorker = new JavaPolyWorker(data.data.options);
      self.javaPolyWorker.init( data.data.scripts, (result) => {
        global.self.postMessage({javapoly:{messgeType:'JVM_INIT', success:result}});
      } );
      break;

    default:
      // FIXME here we pass the args and return value.
      // FIXME how to support self-defined object, stream, file handler...
      if (typeof (data) == "object") {
        let id = data.messageId;
        if (!id)//invalid command, ignore 
          return;

        window.javaPolyMessageTypes[id] = data.messageType;
        window.javaPolyData[id] = data.data;
        window.javaPolyCallbacks[id] = (returnValue) => {
          global.self.postMessage({javapoly:{messageId: id, messageType:data.messageType, returnValue:returnValue}});
        } ;

        // we can't use the window.postMesssage here in Webworkers.
        // FIXME Hack the Main.js.installListener() by using the webworker.addEventListener
        // window.postMessage({ javapoly:{ 'messageId':""+id } }, "*");

        e.preventDefault();
        if (!window.javaPolyEvents)
          window.javaPolyEvents = [];
        window.javaPolyEvents.push(e);
        if (window.javaPolyCallback) {
          window.javaPolyCallback();
        }
      }
      break;
  };
}, false);


