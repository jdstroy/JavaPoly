import * as _ from 'underscore';
import JavaPolyLoader from '../JavaPolyLoader';
import WorkerDispatcher from './WorkerDispatcher.js'


class JavaPolyWorker {
  constructor(options) {

    /**
     * Object with options of JavaPoly
     * @type {Object}
     */
    this.options = options;

    // NOTES, hack global window variable used in doppio, javapoly.
    global.window = global.self;

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


