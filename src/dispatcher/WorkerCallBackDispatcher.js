"use strict";
/**
 * The WorkerCallBackDispatcher is executed in Browser side.
 * This should be init in Browser main Thread.
 *
 * it's used to send message/java-command(METHOD_INVOKATION,CLASS_LOADING...)
 * to Javapoly workers(JVM  also included in the web workers), will also listen the return message (include the return value) from javapoly
 * workers.
 *
 */
class WorkerCallBackDispatcher {

  constructor(options, worker){
    this.options = options;
    this.worker = worker;

    this.javaPolyIdCount = 0;
    //used to record callback for every message.
    this.javaPolyCallbacks = {};

    this.installListener();
  }

  //listen at browser side, to recv return value and callback
  installListener(){
    this.worker.addEventListener('message', e => {
      const data = e.data.javapoly;

      const cb = this.javaPolyCallbacks[data.messageId];
      delete this.javaPolyCallbacks[data.messageId];

      // 1. JVM Init response
      // 2. JVM command(METHOD_INVOKATION/CLASS_LOADING/...) response
      if (cb) {
        cb(data.returnValue);
      }


    }, false);

    // send init request to webworker
    // we need to send options also.
    this.postMessage('WORKER_INIT', 0, {options:this.options}, (success) =>{
      if (success == true){
        console.log('Worker init success');
      } else {
        console.log('Worker init failed in webWorkers');
        // try to load in main thread directly when JVM init failed in WebWorkers ?

        // TODO: This won't be as simple as calling this function as messages would have been already entered into
        // dispatcher. We need to delay calling resovleDispatcherReady until the JVM success result comes back.
        // this.loadJavaPolyCoreInBrowser(javaMimeScripts, resolveDispatcherReady);
      }
    });
  }

  /**
   * For Web Worker, we also need to pass command args to other side.
   * because Browser main thread and Web worker are in different Context.
   * (for non-workers mode, we can easily share args, callback function in Global object).
   *
   * We also need to record callback function for every message.
   */
  postMessage(messageType, priority, data, callback) {

    const id = this.javaPolyIdCount++;
    this.javaPolyCallbacks[id] = callback;

    this.worker.postMessage({javapoly:{messageId:""+id, messageType:messageType, priority: priority, data:data}});
  }

  reflect(jsObj) {
    return jsObj;
  }

  unreflect(result) {
    return result;
  }
}

export default WorkerCallBackDispatcher;
