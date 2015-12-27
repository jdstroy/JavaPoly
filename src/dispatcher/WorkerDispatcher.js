import CommonDispatcher from '../dispatcher/CommonDispatcher.js'

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
    this.idCount = 0;
  }

  // Called by the worker when loading scripts
  postMessage(messageType, priority, data, callback) {
    const id = this.idCount++;
    this.handle ({
      messageId: "localMessage" + id,
      messageType: messageType,
      priority : priority,
      data: data
    }, callback);
  }

  // Handle message data coming from the web-worker message bridge
  handle(data, callback) {
    if (typeof (data) == "object") {
      const id = data.messageId;
      if (!id)// invalid command, ignore
        return;

      //store the message to commonDispatcher for javapoly to handle
      self.javaPolyMessageTypes[id] = data.messageType;
      self.javaPolyData[id] = data.data;

      if (callback) {
        self.javaPolyCallbacks[id] = callback;
      } else {
        self.javaPolyCallbacks[id] = (returnValue) => {
          global.self.postMessage({
            javapoly:{
              messageId: id, messageType:data.messageType, returnValue:returnValue
          }});
        };
      }

      this.addMessage(id, data.priority);

      if (self.javaPolyCallback) {
        self.javaPolyCallback();
      }
    }
  }

};

export default WorkerDispatcher;
