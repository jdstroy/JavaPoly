import CommonDispatcher from '../core/CommonDispatcher.js'

/**
 * The WorkerDispatcher is executed in web workers side.
 * it is used to handle message/java-command from Browser side.
 * 
 * It recv message from browser side and pass the message to JVM, and then return the returnValue to browser side.
 * The message dispatch from worker to JVM using the way javapoly do (extends from CommonDispatcher).
 * 
 */
class WorkerDispatcher extends CommonDispatcher{

  constructor(){
    super();
  }

  /**
   * Override the listener.
   * 
   * We get message data from message body rather then the shared global object.
   */
  installListener(){
    self.addEventListener('message', e => {
      if (!e.data || !e.data.javapoly || !e.data.javapoly.messageType)//invalid command, ignore 
        return;

      let data = e.data.javapoly;
      // FIXME how to support self-defined object(also pass the function of object), stream, file handler...
      if (typeof (data) == "object") {
        let id = data.messageId;
        if (!id)// invalid command, ignore
          return;

        //store the message to commonDispatcher for javapoly to handle
        window.javaPolyMessageTypes[id] = data.messageType;
        window.javaPolyData[id] = data.data;
        window.javaPolyCallbacks[id] = (returnValue) => {
          global.self.postMessage({javapoly:{messageId: id, messageType:data.messageType, returnValue:this.unwrapObjectForWebWorker(returnValue)}});
        } ;

        e.preventDefault();
        window.javaPolyEvents.push(e);
        if (window.javaPolyCallback) {
          window.javaPolyCallback();
        }
      }
    }, false);
  }

  /**
   * some special converting for data sent from web worker to browser.
   * Because browser don't understand javapoly internal data type when javapoly working in web workers. 
   * we need to convert them to javascript type before sent.
   * 
   * We could use most unwrapper method from Main.js.unwrapObject();
   */
  unwrapObjectForWebWorker(obj) {
    if (obj === null)
      return null;
    if (obj['getClass']) {
      let cls = obj.getClass();
      if (cls.className === 'Ljava/lang/Long;'){
        // for long, we now convert it javascript number.
        // FIXME there will be precision lost problem here, 64bit integers don't work natively in javascript.
        // we may also return a Exception.
        return obj.unbox().toNumber();
      }else{
        return obj.unbox();
      }
    }else 
      return obj;
  } 

};

export default WorkerDispatcher;
