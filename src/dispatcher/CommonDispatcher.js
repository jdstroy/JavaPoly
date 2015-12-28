/**
 * The CommonDispatcher is an abstract base class for other dispatchers.
 *
 * we define the some global Object{javaPolyMessageTypes,javaPolyCallbacks,javaPolyData}
 * for sharing args, callback function.
 *
 */

class CommonDispatcher {

  constructor() {
    // This class is abstract (can't be instantiated directly)
    if (this.constructor === CommonDispatcher) {
      throw TypeError("new of abstract class CommonDispatcher");
    }

    this.initDispatcher();
  }

  initDispatcher() {
    window.javaPolyEvents = [];
    window.javaPolyMessageTypes = {};
    window.javaPolyCallbacks = {};
    window.javaPolyData = {};
    window.javaPolyIdCount = 0;
  }

  // JVM messages are added to a queue and dequed from the JVM main thread.
  handleJVMMessage(id, priority, messageType, data, callback) {

    this.addMessage(id, priority, messageType, data, callback);

    if (window.javaPolyCallback) {
      window.javaPolyCallback();
    }
  }

  /* Add message with higher priority messages ahead of the lower priority ones */
  addMessage(id, priority, messageType, data, callback) {
    self.javaPolyMessageTypes[id] = messageType;
    self.javaPolyData[id] = data;
    self.javaPolyCallbacks[id] = callback;

    const queue = window.javaPolyEvents;
    const pos = queue.findIndex(e => e[1] < priority);
    const value = [""+id, priority];
    if (pos < 0) {
      // insert at end
      queue.push(value);
    } else {
      // insert at position
      queue.splice(pos, 0, value);
    }
  }

  /**
   * dequeue a message and get the messageID. Returns undefined when there is no message in the queue.
   */
  getMessageId() {
    const msg = window.javaPolyEvents.shift();
    if (msg) {
      const id = msg[0];
      return id;
    } else {
      return undefined;
    }
  }

  getMessageType(msgId){
    // may want to delete the data after fetch
    const messageType = window.javaPolyMessageTypes[msgId];
    delete window.javaPolyMessageTypes[msgId];
    return messageType;
  }

  getMessageData(msgId){
    // may want to delete the data after fetch
    const messageData =  window.javaPolyData[msgId];
    delete window.javaPolyData[msgId];
    return messageData;
  }

  getMessageCallback(msgId){
    const callback = window.javaPolyCallbacks[msgId];
    delete window.javaPolyCallbacks[msgId];
    return callback;
  }

  callbackMessage(msgId, returnValue){
    const callback = window.javaPolyCallbacks[msgId];
    delete window.javaPolyCallbacks[msgId];
    callback(returnValue);
  }

}

export default CommonDispatcher;
