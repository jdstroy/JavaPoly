import WorkerDispatcher from '../dispatcher/WorkerDispatcher.js'

class JavaPolyWorker {
  constructor(options) {
    this.options = options;
    this.isJavaPolyWorker = true;
  }

  getId(){
    // running multiple javapoly instances in webworker will generate corresponding number of web workers.
    // with only one javapoly instance in each workers.
    // so we cloud just store the only one javapoly instance in global.self to simplify.
    return 'default';
  }

  static getInstance(javapolyId){
    return self.javapoly;
  }

  init(dispatcher) {
    this.dispatcher = dispatcher;
    this.dispatcherReady = Promise.resolve(this.dispatcher);
  }

}

// NOTES, hack global window variable used in doppio, javapoly.
global.window = global.self;
global.self.JavaPoly = JavaPolyWorker;

self.addEventListener('message', function(e) {
  if (!e.data || !e.data.javapoly) {
    //invalid command, ignore
    return;
  }

  const data = e.data.javapoly;

  switch (data.messageType) {
    case 'WORKER_INIT':
      const options = data.data.options;
      self.javapoly = new JavaPolyWorker(options);
      self.javapoly.init(new WorkerDispatcher(self.javapoly));
      global.self.postMessage({javapoly:{messageId:data.messageId, messageType:'WORKER_INIT', returnValue:true}});
      break;
    default:
      self.javapoly.dispatcher.handleWorkerMessage(data);
      break;
  };
}, false);
