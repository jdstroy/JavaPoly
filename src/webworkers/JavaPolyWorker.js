import WorkerDispatcher from '../dispatcher/WorkerDispatcher.js'

class JavaPolyWorker {
  constructor(options) {
    this.options = options;
    this.isJavaPolyWorker = true;
  }

  init(dispatcher) {
    this.dispatcher = dispatcher;
    this.dispatcherReady = Promise.resolve(this.dispatcher);
  }

}

// NOTES, hack global window variable used in doppio, javapoly.
global.window = global.self;

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
      self.javapoly.init(new WorkerDispatcher(options));
      global.self.postMessage({javapoly:{messageId:data.messageId, messageType:'WORKER_INIT', returnValue:true}});
      break;
    default:
      self.javapoly.dispatcher.handleWorkerMessage(data);
      break;
  };
}, false);
