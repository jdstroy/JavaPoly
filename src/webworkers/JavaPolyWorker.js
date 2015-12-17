import * as _ from 'underscore';
import JavaPolyLoader from '../JavaPolyLoader';
import WorkerDispatcher from './WorkerDispatcher.js'


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
    importScripts(this.options.browserfsLibUrl + 'browserfs.min.js');
    importScripts(this.options.doppioLibUrl + 'doppio.js');
  }

  /**
   * init the jvm and load library in web workers
   */
  init(javaMimeScripts, cb) {
    this.dispatcher = new WorkerDispatcher();
    window.isJavaPolyWorker = true;

    new JavaPolyLoader(this, javaMimeScripts, null, () => cb(true));
  }

}

self.addEventListener('message', function(e) {
  if (!e.data || !e.data.javapoly)//invalid command, ignore 
    return;
  let data = e.data.javapoly; 

  switch (data.messageType) {
  // NOTES, we need some options,Java MIME script path info from browser main thread.
  // so here we add a JVM_INIT command.
    case 'JVM_INIT':
      self.removeEventListener('message', this);
      self.javaPolyWorker = new JavaPolyWorker(data.data.options);
      self.javaPolyWorker.init( data.data.scripts, (result) => {
        global.self.postMessage({javapoly:{messageId:data.messageId, messgeType:'JVM_INIT', returnValue:result}});
      } );
      //FIXME may want to remove this listener after webworker start success.
      break;
    default:
      //NOTES, the jvm message will be listened by the dispatcher.
      break;
  };
}, false);


