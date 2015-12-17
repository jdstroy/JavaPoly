import CommonDispatcher from '../CommonDispatcher.js'

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
   * We get message data from message body rather then the shared global object.
   */
  installListener(){
    self.addEventListener('message', function(e) {
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
          global.self.postMessage({javapoly:{messageId: id, messageType:data.messageType, returnValue:returnValue}});
        } ;

        e.preventDefault();
        window.javaPolyEvents.push(e);
        if (window.javaPolyCallback) {
          window.javaPolyCallback();
        }
      }
    }, false);
  }
};

export default WorkerDispatcher;
