import JavaPolyLoader from '../core/JavaPolyLoader';
import WorkerDispatcher from '../dispatcher/WorkerDispatcher.js'

class JavaPolyWorker {
  constructor(options) {

    /**
     * Object with options of JavaPoly
     * @type {Object}
     */
    this.options = options;

    // load browserfs.min.js and doppio.js
    importScripts(this.options.browserfsLibUrl + 'browserfs.min.js');
    importScripts(this.options.doppioLibUrl + 'doppio.js');

    //create a global javapoly object in webworkers.
    self.javapoly = this;
  }

  /**
   * init the jvm and load library in web workers
   */
  init(javaMimeScripts, cb) {
    this.dispatcher= self.dispatcher;
    this.dispatcherReady = Promise.resolve(this.dispatcher);
    window.isJavaPolyWorker = true;

    new JavaPolyLoader(this, javaMimeScripts, () => cb(true));
  }

}

// NOTES, hack global window variable used in doppio, javapoly.
global.window = global.self;

self.dispatcher = new WorkerDispatcher();

self.addEventListener('message', function(e) {
  if (!e.data || !e.data.javapoly)//invalid command, ignore
    return;

  // e.preventDefault();
  let data = e.data.javapoly;

  switch (data.messageType) {
    // NOTES, we need some options,Java MIME script path info from browser main thread.
    // so here we add a JVM_INIT command.
    case 'JVM_INIT':
      self.javaPolyWorker = new JavaPolyWorker(data.data.options);
      self.javaPolyWorker.init( data.data.scripts, (result) => {
        global.self.postMessage({javapoly:{messageId:data.messageId, messageType:'JVM_INIT', returnValue:result}});
      } );
      break;
    default:
      self.dispatcher.handle(data);
      break;
  };
}, false);
