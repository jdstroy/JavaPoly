import CommonDispatcher from './CommonDispatcher.js'
import DoppioManager from '../doppioManager/DoppioManager.js'

/**
 * The WorkerDispatcher is executed in web workers side.
 * it is used to handle message/java-command from Browser side.
 *
 * It recv message from browser side and pass the message to JVM, and then return the returnValue to browser side.
 * The message dispatch from worker to JVM using the way javapoly do (extends from CommonDispatcher).
 *
 */
class WorkerDispatcher extends CommonDispatcher{

  constructor(javapoly){
    super(javapoly);
    this.idCount = 0;
  }

  initDoppioManager(javapoly) {
    const options = javapoly.options;
    importScripts(options.browserfsLibUrl + 'browserfs.min.js');
    importScripts(options.doppioLibUrl + 'doppio.js');

    return Promise.resolve(new DoppioManager(javapoly));
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
  handleWorkerMessage(data, callback) {
    const id = data.messageId;

    if (!callback) {
      callback = (returnValue) => {
        global.self.postMessage({
          javapoly:{
            messageId: id, messageType:data.messageType, returnValue:returnValue
        }});
      };
    }

    this.handleIncomingMessage(id, data.priority, data.messageType, data.data, callback);
  }

};

export default WorkerDispatcher;
