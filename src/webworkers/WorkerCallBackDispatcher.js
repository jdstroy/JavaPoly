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
  
  constructor(worker){
    this.worker = worker; 

    window.javaPolyIdCount = 0;
    //used to record callback for every message.
    window.javaPolyCallbacks = {};
  }

  //listen at browser side, to recv return value and callback
  installListener(){
    this.worker.addEventListener('message', e => {
      let data = e.data.javapoly;

      let cb = window.javaPolyCallbacks[data.messageId];
      delete window.javaPolyCallbacks[data.messageId];

      // 1. JVM Init response
      // 2. JVM command(METHOD_INVOKATION/CLASS_LOADING/...) response
      cb(data.returnValue);

    }, false);
  }
  
  /**
   * For Web Worker, we also need to pass command args to other side. 
   * because Browser main thread and Web worker are in different Context.
   * (for non-workers mode, we can easily share args, callback function in Global object).
   * 
   * We also need to record callback function for every message. 
   */
  postMessage(messageType, priority, data, callback){
    
    let id = window.javaPolyIdCount++;
    window.javaPolyCallbacks[id] = callback;
 
    this.worker.postMessage({javapoly:{messageId:""+id, messageType:messageType, data:data}});
  }
  
}

export default WorkerCallBackDispatcher;
